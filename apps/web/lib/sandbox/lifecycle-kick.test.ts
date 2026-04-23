import { beforeEach, describe, expect, mock, test } from "bun:test";

mock.module("server-only", () => ({}));

type FetchCall = { path: string; init?: RequestInit };

let fetchCalls: FetchCall[] = [];
let fetchResponse: Response | Error = new Response(
  JSON.stringify({ ok: true }),
  { status: 200, headers: { "content-type": "application/json" } },
);

const workflowFetchSpy = mock(async (path: string, init?: RequestInit) => {
  fetchCalls.push({ path, init });
  if (fetchResponse instanceof Error) {
    throw fetchResponse;
  }
  return fetchResponse;
});

mock.module("@/lib/runtime-connection/workflow-client", () => ({
  getWorkflowClient: () => ({
    baseUrl: "http://workflow-runtime",
    fetch: workflowFetchSpy,
    health: async () => ({ ok: true, status: 200 }),
  }),
}));

const lifecycleKickModulePromise = import("./lifecycle-kick");

const consoleErrorSpy = mock(() => {});

function getLastBody(): { sessionId?: string; reason?: string } | null {
  const last = fetchCalls.at(-1);
  if (!last?.init?.body || typeof last.init.body !== "string") {
    return null;
  }
  return JSON.parse(last.init.body);
}

describe("kickSandboxLifecycleWorkflow", () => {
  beforeEach(() => {
    fetchCalls = [];
    fetchResponse = new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
    workflowFetchSpy.mockClear();
    consoleErrorSpy.mockClear();
    console.error = consoleErrorSpy as typeof console.error;
  });

  test("POSTs sessionId + reason to the workflow runtime's kick endpoint", async () => {
    const { kickSandboxLifecycleWorkflow } = await lifecycleKickModulePromise;

    const scheduled: Array<() => Promise<void>> = [];
    kickSandboxLifecycleWorkflow({
      sessionId: "session-1",
      reason: "status-check-overdue",
      scheduleBackgroundWork: (callback) => {
        scheduled.push(callback);
      },
    });

    expect(scheduled).toHaveLength(1);
    await scheduled[0]?.();

    expect(workflowFetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchCalls[0]?.path).toBe("/api/sandbox/lifecycle/kick");
    expect(fetchCalls[0]?.init?.method).toBe("POST");
    expect(getLastBody()).toEqual({
      sessionId: "session-1",
      reason: "status-check-overdue",
    });
  });

  test("runs immediately when no scheduleBackgroundWork is provided", async () => {
    const { kickSandboxLifecycleWorkflow } = await lifecycleKickModulePromise;

    kickSandboxLifecycleWorkflow({
      sessionId: "session-2",
      reason: "reconnect",
    });

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(workflowFetchSpy).toHaveBeenCalledTimes(1);
    expect(getLastBody()).toEqual({
      sessionId: "session-2",
      reason: "reconnect",
    });
  });

  test("logs and swallows runtime failures without throwing", async () => {
    fetchResponse = new Error("workflow-runtime unreachable");

    const { kickSandboxLifecycleWorkflow } = await lifecycleKickModulePromise;

    const scheduled: Array<() => Promise<void>> = [];
    kickSandboxLifecycleWorkflow({
      sessionId: "session-3",
      reason: "manual-stop",
      scheduleBackgroundWork: (callback) => {
        scheduled.push(callback);
      },
    });

    await expect(scheduled[0]?.()).resolves.toBeUndefined();
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  test("logs non-2xx responses but does not throw", async () => {
    fetchResponse = new Response(JSON.stringify({ error: "boom" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });

    const { kickSandboxLifecycleWorkflow } = await lifecycleKickModulePromise;

    const scheduled: Array<() => Promise<void>> = [];
    kickSandboxLifecycleWorkflow({
      sessionId: "session-4",
      reason: "sandbox-created",
      scheduleBackgroundWork: (callback) => {
        scheduled.push(callback);
      },
    });

    await expect(scheduled[0]?.()).resolves.toBeUndefined();
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});
