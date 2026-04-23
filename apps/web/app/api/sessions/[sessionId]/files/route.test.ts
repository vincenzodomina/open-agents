import { beforeEach, describe, expect, mock, test } from "bun:test";

type AuthResult =
  | {
      ok: true;
      userId: string;
    }
  | {
      ok: false;
      response: Response;
    };

type TestSandboxState = {
  type: string;
  sandboxId?: string;
};

type OwnedSessionResult =
  | {
      ok: true;
      sessionRecord: {
        id: string;
        userId: string;
        sandboxState: TestSandboxState | null;
      };
    }
  | {
      ok: false;
      response: Response;
    };

type TestDirent = {
  name: string;
  isDirectory(): boolean;
  isFile(): boolean;
  isSymbolicLink(): boolean;
};

const connectCalls: TestSandboxState[] = [];
const readdirCalls: string[] = [];
const updateCalls: Array<{
  sessionId: string;
  patch: Record<string, unknown>;
}> = [];

let authResult: AuthResult = { ok: true, userId: "user-1" };
let ownedSessionResult: OwnedSessionResult = {
  ok: true,
  sessionRecord: {
    id: "session-1",
    userId: "user-1",
    sandboxState: {
      type: "vercel",
      sandboxId: "sbx-1",
    },
  },
};
let readdirImplementation: (path: string) => Promise<TestDirent[]>;

mock.module("@/app/api/sessions/_lib/session-context", () => ({
  requireAuthenticatedUser: async () => authResult,
  requireOwnedSessionWithSandboxGuard: async () => ownedSessionResult,
}));

mock.module("@open-harness/sandbox", () => ({
  connectSandbox: async (sandboxState: TestSandboxState) => {
    connectCalls.push(sandboxState);
    return {
      workingDirectory: "/workspace",
      readdir: async (path: string) => {
        readdirCalls.push(path);
        return readdirImplementation(path);
      },
    };
  },
}));

mock.module("@/lib/db/sessions", () => ({
  updateSession: async (sessionId: string, patch: Record<string, unknown>) => {
    updateCalls.push({ sessionId, patch });
  },
}));

mock.module("@/lib/sandbox/lifecycle", () => ({
  buildHibernatedLifecycleUpdate: () => ({ lifecycleState: "hibernated" }),
}));

mock.module("@/lib/sandbox/utils", () => ({
  clearUnavailableSandboxState: () => null,
  isSessionSandboxOperational: (sessionRecord: {
    sandboxState: TestSandboxState | null;
  }) => Boolean(sessionRecord.sandboxState?.sandboxId),
  isSandboxUnavailableError: (message: string) =>
    message.toLowerCase().includes("sandbox unavailable"),
}));

let routeImportVersion = 0;

async function loadRouteModule() {
  routeImportVersion += 1;
  return import(`./route?test=${routeImportVersion}`);
}

function createContext(sessionId = "session-1") {
  return {
    params: Promise.resolve({ sessionId }),
  };
}

function dirent(
  name: string,
  type: "file" | "directory" | "symlink",
): TestDirent {
  return {
    name,
    isDirectory: () => type === "directory",
    isFile: () => type === "file",
    isSymbolicLink: () => type === "symlink",
  };
}

describe("/api/sessions/[sessionId]/files", () => {
  beforeEach(() => {
    connectCalls.length = 0;
    readdirCalls.length = 0;
    updateCalls.length = 0;
    authResult = { ok: true, userId: "user-1" };
    ownedSessionResult = {
      ok: true,
      sessionRecord: {
        id: "session-1",
        userId: "user-1",
        sandboxState: {
          type: "vercel",
          sandboxId: "sbx-1",
        },
      },
    };
    readdirImplementation = async (path: string) => {
      switch (path) {
        case "/workspace":
          return [
            dirent("src", "directory"),
            dirent("app", "directory"),
            dirent("readme.md", "file"),
            dirent("node_modules", "directory"),
            dirent("linked", "symlink"),
          ];
        case "/workspace/app":
          return [dirent("routes.ts", "file")];
        case "/workspace/src":
          return [
            dirent("components", "directory"),
            dirent("index.ts", "file"),
          ];
        case "/workspace/src/components":
          return [dirent("button.tsx", "file")];
        default:
          throw new Error(`Unexpected path: ${path}`);
      }
    };
  });

  test("recursively lists workspace files directly from the sandbox filesystem", async () => {
    const { GET } = await loadRouteModule();

    const response = await GET(
      new Request("http://localhost/api/sessions/session-1/files"),
      createContext(),
    );
    const body = (await response.json()) as {
      files: Array<{ value: string; display: string; isDirectory: boolean }>;
    };

    expect(response.status).toBe(200);
    expect(body.files).toEqual([
      { value: "app/", display: "app/", isDirectory: true },
      { value: "readme.md", display: "readme.md", isDirectory: false },
      { value: "src/", display: "src/", isDirectory: true },
      {
        value: "app/routes.ts",
        display: "app/routes.ts",
        isDirectory: false,
      },
      {
        value: "src/components/",
        display: "src/components/",
        isDirectory: true,
      },
      { value: "src/index.ts", display: "src/index.ts", isDirectory: false },
      {
        value: "src/components/button.tsx",
        display: "src/components/button.tsx",
        isDirectory: false,
      },
    ]);
    expect(connectCalls).toEqual([
      {
        type: "vercel",
        sandboxId: "sbx-1",
      },
    ]);
    expect(readdirCalls).toEqual([
      "/workspace",
      "/workspace/app",
      "/workspace/src",
      "/workspace/src/components",
    ]);
  });

  test("marks the session hibernated when the sandbox becomes unavailable", async () => {
    readdirImplementation = async () => {
      throw new Error("sandbox unavailable: connection closed");
    };
    const { GET } = await loadRouteModule();

    const response = await GET(
      new Request("http://localhost/api/sessions/session-1/files"),
      createContext(),
    );
    const body = (await response.json()) as { error: string };

    expect(response.status).toBe(409);
    expect(body.error).toBe("Sandbox is unavailable. Please resume sandbox.");
    expect(updateCalls).toEqual([
      {
        sessionId: "session-1",
        patch: {
          sandboxState: null,
          lifecycleState: "hibernated",
        },
      },
    ]);
  });
});
