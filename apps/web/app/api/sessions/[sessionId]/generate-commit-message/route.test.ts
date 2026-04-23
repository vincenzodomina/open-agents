import { beforeEach, describe, expect, mock, test } from "bun:test";

let currentSession: { user: { id: string } } | null = {
  user: { id: "user-1" },
};
let botVerification: { isBot: boolean } = { isBot: false };
let dbSession: {
  userId: string;
  title: string;
  sandboxState: unknown;
  status: string;
} | null = {
  userId: "user-1",
  title: "My session",
  sandboxState: { type: "just-bash", state: { id: "s1" } },
  status: "running",
};
const runtimeCalls: Array<{ path: string; body: string | undefined }> = [];
let runtimeResponse: Response = Response.json({ message: "feat: ok" });

mock.module("@/lib/session/get-server-session", () => ({
  getServerSession: async () => currentSession,
}));

mock.module("@/lib/botid-server", () => ({
  verifyBotIdRequest: async () => botVerification,
}));

mock.module("@/lib/db/sessions", () => ({
  getSessionById: async () => dbSession,
}));

mock.module("@/lib/sandbox/utils", () => ({
  isSessionSandboxOperational: (row: { status: string } | null) =>
    row?.status === "running",
}));

mock.module("@/lib/runtime-connection/server-client", () => ({
  getRuntimeClient: () => ({
    baseUrl: "http://runtime",
    fetch: async (path: string, init?: RequestInit) => {
      const body = typeof init?.body === "string" ? init.body : undefined;
      runtimeCalls.push({ path, body });
      return runtimeResponse;
    },
    health: async () => ({ ok: true, status: 200 }),
  }),
}));

const routeModulePromise = import("./route");

function paramsFor(id: string): { params: Promise<{ sessionId: string }> } {
  return { params: Promise.resolve({ sessionId: id }) };
}

describe("/api/sessions/[sessionId]/generate-commit-message (proxy)", () => {
  beforeEach(() => {
    currentSession = { user: { id: "user-1" } };
    botVerification = { isBot: false };
    dbSession = {
      userId: "user-1",
      title: "My session",
      sandboxState: { type: "just-bash", state: { id: "s1" } },
      status: "running",
    };
    runtimeResponse = Response.json({ message: "feat: ok" });
    runtimeCalls.length = 0;
  });

  test("returns 401 when unauthenticated", async () => {
    currentSession = null;
    const { POST } = await routeModulePromise;
    const res = await POST(new Request("http://x"), paramsFor("s1"));
    expect(res.status).toBe(401);
    expect(runtimeCalls).toHaveLength(0);
  });

  test("returns 403 when bot", async () => {
    botVerification = { isBot: true };
    const { POST } = await routeModulePromise;
    const res = await POST(new Request("http://x"), paramsFor("s1"));
    expect(res.status).toBe(403);
    expect(runtimeCalls).toHaveLength(0);
  });

  test("returns 404 when session missing or not owned", async () => {
    dbSession = null;
    const { POST } = await routeModulePromise;
    const res = await POST(new Request("http://x"), paramsFor("s1"));
    expect(res.status).toBe(404);
    expect(runtimeCalls).toHaveLength(0);
  });

  test("returns 400 when sandbox is not operational", async () => {
    dbSession = {
      ...(dbSession ?? {
        userId: "user-1",
        title: "",
        sandboxState: null,
      }),
      userId: "user-1",
      title: "",
      sandboxState: { type: "just-bash" },
      status: "stopped",
    };
    const { POST } = await routeModulePromise;
    const res = await POST(new Request("http://x"), paramsFor("s1"));
    expect(res.status).toBe(400);
    expect(runtimeCalls).toHaveLength(0);
  });

  test("forwards sandboxState and session title to runtime", async () => {
    const { POST } = await routeModulePromise;
    const res = await POST(new Request("http://x"), paramsFor("s1"));
    expect(res.status).toBe(200);
    expect(runtimeCalls).toHaveLength(1);
    expect(runtimeCalls[0]?.path).toBe("/v1/generate-commit-message");
    const body = JSON.parse(runtimeCalls[0]?.body ?? "{}") as {
      sandboxState: { type: string };
      sessionTitle: string;
    };
    expect(body.sandboxState.type).toBe("just-bash");
    expect(body.sessionTitle).toBe("My session");
  });

  test("preserves runtime error status", async () => {
    runtimeResponse = Response.json({ error: "boom" }, { status: 500 });
    const { POST } = await routeModulePromise;
    const res = await POST(new Request("http://x"), paramsFor("s1"));
    expect(res.status).toBe(500);
  });
});
