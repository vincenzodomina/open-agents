import { beforeEach, describe, expect, mock, test } from "bun:test";
import { DEFAULT_SANDBOX_TIMEOUT_MS } from "@/lib/sandbox/config";

mock.module("server-only", () => ({}));

interface TestSessionRecord {
  id: string;
  userId: string;
  lifecycleVersion: number;
  sandboxState: { type: "vercel" | "just-bash" };
  globalSkillRefs: Array<{ source: string; skillName: string }>;
}

interface KickCall {
  sessionId: string;
  reason: string;
}

interface ConnectConfig {
  state: {
    type: "vercel" | "just-bash";
    sandboxName?: string;
  };
  options?: {
    timeout?: number;
    persistent?: boolean;
    resume?: boolean;
    createIfMissing?: boolean;
  };
}

const kickCalls: KickCall[] = [];
const updateCalls: Array<{
  sessionId: string;
  patch: Record<string, unknown>;
}> = [];
const connectConfigs: ConnectConfig[] = [];
const writeFileCalls: Array<{ path: string; content: string }> = [];
const execCalls: Array<{ command: string; cwd: string; timeoutMs: number }> =
  [];

let sessionRecord: TestSessionRecord;
let connectSandboxError: Error | null;

mock.module("@/lib/session/get-server-session", () => ({
  getServerSession: async () => ({
    user: {
      id: "user-1",
      username: "nico",
      name: "Nico",
      email: "nico@example.com",
    },
  }),
}));

mock.module("@/lib/db/sessions", () => ({
  getChatsBySessionId: async () => [],
  getSessionById: async () => sessionRecord,
  updateSession: async (sessionId: string, patch: Record<string, unknown>) => {
    updateCalls.push({ sessionId, patch });
    return {
      ...sessionRecord,
      ...patch,
    };
  },
}));

mock.module("@/lib/sandbox/lifecycle-kick", () => ({
  kickSandboxLifecycleWorkflow: (input: KickCall) => {
    kickCalls.push(input);
  },
}));

mock.module("@open-harness/sandbox", () => ({
  connectSandbox: async (config: ConnectConfig) => {
    if (connectSandboxError) {
      throw connectSandboxError;
    }
    connectConfigs.push(config);
    const sandboxName = config.state.sandboxName ?? "session_session-1";
    const isJustBash = config.state.type === "just-bash";

    return {
      workingDirectory: "/vercel/sandbox",
      timeout: isJustBash ? undefined : DEFAULT_SANDBOX_TIMEOUT_MS,
      getState: () => ({
        type: config.state.type,
        sandboxName,
        ...(isJustBash
          ? { runtimeState: "active" as const }
          : { expiresAt: Date.now() + 120_000 }),
      }),
      exec: async (command: string, cwd: string, timeoutMs: number) => {
        execCalls.push({ command, cwd, timeoutMs });
        if (command === 'printf %s "$HOME"') {
          return {
            success: true,
            exitCode: 0,
            stdout: "/root",
            stderr: "",
            truncated: false,
          };
        }

        return {
          success: true,
          exitCode: 0,
          stdout: "",
          stderr: "",
          truncated: false,
        };
      },
      writeFile: async (path: string, content: string) => {
        writeFileCalls.push({ path, content });
      },
      stop: async () => {},
    };
  },
}));

const routeModulePromise = import("./route");

const vercelCliCleanupExec = [
  {
    command: 'printf %s "$HOME"',
    cwd: "/vercel/sandbox",
    timeoutMs: 5000,
  },
  {
    command: "rm -f '/root/.local/share/com.vercel.cli/auth.json'",
    cwd: "/vercel/sandbox",
    timeoutMs: 5000,
  },
  {
    command: "rm -f '/vercel/sandbox/.vercel/project.json'",
    cwd: "/vercel/sandbox",
    timeoutMs: 5000,
  },
];

describe("/api/sandbox lifecycle kicks", () => {
  beforeEach(() => {
    kickCalls.length = 0;
    updateCalls.length = 0;
    connectConfigs.length = 0;
    writeFileCalls.length = 0;
    execCalls.length = 0;
    connectSandboxError = null;
    sessionRecord = {
      id: "session-1",
      userId: "user-1",
      lifecycleVersion: 3,
      sandboxState: { type: "vercel" },
      globalSkillRefs: [],
    };
  });

  test("uses session_<sessionId> as the persistent sandbox name", async () => {
    const { POST } = await routeModulePromise;

    const request = new Request("http://localhost/api/sandbox", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: "session-1",
        sandboxType: "vercel",
      }),
    });

    const response = await POST(request);

    expect(response.ok).toBe(true);
    expect(kickCalls).toEqual([
      {
        sessionId: "session-1",
        reason: "sandbox-created",
      },
    ]);
    expect(connectConfigs[0]).toMatchObject({
      state: {
        type: "vercel",
        sandboxName: "session_session-1",
      },
      options: {
        persistent: true,
        resume: true,
        createIfMissing: true,
      },
    });
  });

  test("creates just-bash sandboxes without timeout semantics", async () => {
    const { POST } = await routeModulePromise;

    const response = await POST(
      new Request("http://localhost/api/sandbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: "session-1",
          sandboxType: "just-bash",
        }),
      }),
    );

    expect(response.ok).toBe(true);
    expect(connectConfigs[0]).toMatchObject({
      state: {
        type: "just-bash",
        sandboxName: "session_session-1",
      },
      options: {
        persistent: true,
        resume: true,
        createIfMissing: true,
      },
    });
    expect(connectConfigs[0]?.options?.timeout).toBeUndefined();
    expect(updateCalls[0]?.patch.sandboxState).toEqual({
      type: "just-bash",
      sandboxName: "session_session-1",
      runtimeState: "active",
    });
    expect(updateCalls[0]?.patch.sandboxExpiresAt).toBeNull();

    const payload = (await response.json()) as {
      timeout: number | null;
      mode: string;
    };
    expect(payload.timeout).toBeNull();
    expect(payload.mode).toBe("just-bash");
  });

  test("rejects repo-backed sandbox requests", async () => {
    const { POST } = await routeModulePromise;

    const response = await POST(
      new Request("http://localhost/api/sandbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoUrl: "https://github.com/acme/private-repo",
          branch: "main",
          sandboxType: "vercel",
        }),
      }),
    );
    const payload = (await response.json()) as { error: string };

    expect(response.status).toBe(400);
    expect(payload.error).toBe(
      "Repository-backed sandboxes are no longer supported",
    );
    expect(connectConfigs).toHaveLength(0);
  });

  test("Vercel CLI sync clears auth and project files without writing tokens", async () => {
    const { POST } = await routeModulePromise;

    const request = new Request("http://localhost/api/sandbox", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: "session-1",
        sandboxType: "vercel",
      }),
    });

    const response = await POST(request);

    expect(response.ok).toBe(true);
    expect(kickCalls).toEqual([
      {
        sessionId: "session-1",
        reason: "sandbox-created",
      },
    ]);
    expect(updateCalls.length).toBeGreaterThan(0);
    const vercelCliWrites = writeFileCalls.filter(
      (call) =>
        call.path.includes("com.vercel.cli") || call.path.includes("/.vercel/"),
    );
    expect(vercelCliWrites).toHaveLength(0);
    expect(execCalls).toEqual(
      expect.arrayContaining(
        vercelCliCleanupExec.map((entry) => expect.objectContaining(entry)),
      ),
    );

    const payload = (await response.json()) as {
      timeout: number;
      mode: string;
    };
    expect(payload.timeout).toBe(DEFAULT_SANDBOX_TIMEOUT_MS);
    expect(payload.mode).toBe("vercel");
  });

  test("new sandboxes install global skills", async () => {
    const { POST } = await routeModulePromise;

    sessionRecord.globalSkillRefs = [
      { source: "vercel/ai", skillName: "ai-sdk" },
    ];

    const response = await POST(
      new Request("http://localhost/api/sandbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: "session-1",
          sandboxType: "vercel",
        }),
      }),
    );

    expect(response.ok).toBe(true);
    expect(execCalls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ command: 'printf %s "$HOME"' }),
        expect.objectContaining({
          command:
            "HOME='/root' npx skills add 'vercel/ai' --skill 'ai-sdk' --agent amp -g -y --copy",
        }),
      ]),
    );
  });

  test("rejects unsupported sandbox types", async () => {
    const { POST } = await routeModulePromise;

    const request = new Request("http://localhost/api/sandbox", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: "session-1",
        sandboxType: "invalid",
      }),
    });

    const response = await POST(request);
    const payload = (await response.json()) as { error: string };

    expect(response.status).toBe(400);
    expect(payload.error).toBe("Invalid sandbox type");
    expect(connectConfigs).toHaveLength(0);
    expect(kickCalls).toHaveLength(0);
  });

  test("returns a structured error when sandbox creation fails", async () => {
    const { POST } = await routeModulePromise;
    connectSandboxError = new Error("just-bash provider failed");

    const response = await POST(
      new Request("http://localhost/api/sandbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: "session-1",
          sandboxType: "just-bash",
        }),
      }),
    );

    const payload = (await response.json()) as { error: string };

    expect(response.status).toBe(500);
    expect(payload.error).toBe("just-bash provider failed");
    expect(kickCalls).toHaveLength(0);
    expect(updateCalls).toHaveLength(0);
  });
});
