import { createRequire } from "node:module";
import { afterAll, beforeEach, describe, expect, mock, test } from "bun:test";

mock.module("server-only", () => ({}));

const require = createRequire(import.meta.url);
const actualUtils = require("./utils.ts") as typeof import("./utils");

type TestSessionRecord = {
  id: string;
  status: "running" | "completed" | "failed" | "archived";
  lifecycleState:
    | "provisioning"
    | "active"
    | "hibernating"
    | "hibernated"
    | "restoring"
    | "archived"
    | "failed";
  sandboxState:
    | {
        type: "vercel";
        sandboxId: string;
      }
    | {
        type: "vercel";
        sandboxName: string;
        expiresAt: number;
      }
    | {
        type: "just-bash";
        sandboxName: string;
        expiresAt?: number;
      }
    | null;
  lifecycleRunId: string | null;
  hibernateAfter?: Date | null;
  lastActivityAt?: Date | null;
  sandboxExpiresAt?: Date | null;
  updatedAt?: Date;
};

let sessionRecord: TestSessionRecord | null = null;
const scheduledCallbacks: Array<() => Promise<void>> = [];

const spies = {
  start: mock(async () => ({ runId: "workflow-run-1" })),
  claimSessionLifecycleRunId: mock(async (sessionId: string, runId: string) => {
    if (
      !sessionRecord ||
      sessionRecord.id !== sessionId ||
      sessionRecord.lifecycleRunId !== null
    ) {
      return false;
    }

    sessionRecord = {
      ...sessionRecord,
      lifecycleRunId: runId,
    };
    return true;
  }),
  getSessionById: mock(async () =>
    sessionRecord
      ? {
          ...sessionRecord,
          sandboxState: sessionRecord.sandboxState
            ? { ...sessionRecord.sandboxState }
            : null,
        }
      : null,
  ),
  updateSession: mock(
    async (_sessionId: string, patch: Record<string, unknown>) => {
      if (!sessionRecord) {
        return null;
      }

      sessionRecord = {
        ...sessionRecord,
        ...patch,
      } as TestSessionRecord;
      return sessionRecord;
    },
  ),
  getChatsBySessionId: mock(async () => []),
  canOperateOnSandbox: mock(() => true),
};

const sandboxLifecycleWorkflow = Symbol("sandboxLifecycleWorkflow");

mock.module("workflow/api", () => ({
  start: spies.start,
}));

mock.module("@/app/workflows/sandbox-lifecycle", () => ({
  sandboxLifecycleWorkflow,
}));

mock.module("@/lib/db/sessions", () => ({
  claimSessionLifecycleRunId: spies.claimSessionLifecycleRunId,
  getChatsBySessionId: spies.getChatsBySessionId,
  getSessionById: spies.getSessionById,
  updateSession: spies.updateSession,
}));

mock.module("./utils", () => ({
  ...actualUtils,
  canOperateOnSandbox: spies.canOperateOnSandbox,
}));

const lifecycleKickModulePromise = import("./lifecycle-kick");

const originalConsoleError = console.error;
const originalConsoleLog = console.log;
const consoleErrorSpy = mock(() => {});
const consoleLogSpy = mock(() => {});

afterAll(() => {
  console.error = originalConsoleError;
  console.log = originalConsoleLog;
});

describe("kickSandboxLifecycleWorkflow", () => {
  beforeEach(() => {
    sessionRecord = {
      id: "session-1",
      status: "running",
      lifecycleState: "active",
      sandboxState: {
        type: "vercel",
        sandboxId: "sandbox-1",
      },
      lifecycleRunId: null,
    };
    scheduledCallbacks.length = 0;
    Object.values(spies).forEach((spy) => spy.mockClear());
    consoleErrorSpy.mockClear();
    consoleLogSpy.mockClear();
    console.error = consoleErrorSpy as typeof console.error;
    console.log = consoleLogSpy as typeof console.log;
  });

  test("claims the lifecycle lease before starting so overlapping kicks only start one workflow", async () => {
    const { kickSandboxLifecycleWorkflow } = await lifecycleKickModulePromise;

    const scheduleBackgroundWork = (callback: () => Promise<void>) => {
      scheduledCallbacks.push(callback);
    };

    kickSandboxLifecycleWorkflow({
      sessionId: "session-1",
      reason: "status-check-overdue",
      scheduleBackgroundWork,
    });
    kickSandboxLifecycleWorkflow({
      sessionId: "session-1",
      reason: "status-check-overdue",
      scheduleBackgroundWork,
    });

    expect(scheduledCallbacks).toHaveLength(2);

    await Promise.all(scheduledCallbacks.map((callback) => callback()));

    expect(spies.claimSessionLifecycleRunId).toHaveBeenCalledTimes(2);
    expect(spies.start).toHaveBeenCalledTimes(1);

    const startCalls = spies.start.mock.calls as unknown as Array<
      [unknown, [string, string, string]]
    >;
    const startArgs = startCalls[0];
    expect(startArgs?.[0]).toBe(sandboxLifecycleWorkflow);
    expect(startArgs?.[1]?.[0]).toBe("session-1");
    expect(startArgs?.[1]?.[1]).toBe("status-check-overdue");
    expect(sessionRecord?.lifecycleRunId).not.toBeNull();
  });

  test("does not start a workflow for just-bash sandboxes", async () => {
    sessionRecord = {
      id: "session-1",
      status: "running",
      lifecycleState: "active",
      sandboxState: {
        type: "just-bash",
        sandboxName: "session_session-1",
      },
      lifecycleRunId: null,
    };

    const { kickSandboxLifecycleWorkflow } = await lifecycleKickModulePromise;

    kickSandboxLifecycleWorkflow({
      sessionId: "session-1",
      reason: "status-check-overdue",
      scheduleBackgroundWork: (callback) => {
        scheduledCallbacks.push(callback);
      },
    });

    expect(scheduledCallbacks).toHaveLength(1);
    await scheduledCallbacks[0]?.();

    expect(spies.start).not.toHaveBeenCalled();
    expect(spies.claimSessionLifecycleRunId).not.toHaveBeenCalled();
  });

  test("releases the claimed lease and falls back inline when workflow start fails", async () => {
    const activityAt = new Date();
    sessionRecord = {
      id: "session-1",
      status: "running",
      lifecycleState: "active",
      sandboxState: {
        type: "vercel",
        sandboxName: "session_session-1",
        expiresAt: Date.now() + 60 * 60_000,
      },
      lifecycleRunId: null,
      lastActivityAt: activityAt,
      hibernateAfter: new Date(activityAt.getTime() + 60 * 60_000),
      sandboxExpiresAt: null,
      updatedAt: activityAt,
    };

    spies.start.mockImplementationOnce(async () => {
      throw new Error("workflow start failed");
    });

    const { kickSandboxLifecycleWorkflow } = await lifecycleKickModulePromise;

    kickSandboxLifecycleWorkflow({
      sessionId: "session-1",
      reason: "status-check-overdue",
      scheduleBackgroundWork: (callback) => {
        scheduledCallbacks.push(callback);
      },
    });

    expect(scheduledCallbacks).toHaveLength(1);

    await scheduledCallbacks[0]?.();

    expect(spies.start).toHaveBeenCalledTimes(1);
    expect(spies.updateSession).toHaveBeenCalledWith("session-1", {
      lifecycleRunId: null,
    });
    expect(sessionRecord?.lifecycleRunId).toBeNull();
  });
});
