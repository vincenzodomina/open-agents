import { defineEventHandler, readBody } from "nitro/h3";
import { start } from "workflow/api";
import { requireAuth } from "../../../utils/auth";
import { canOperateOnSandbox } from "../../../utils/sandbox-utils";
import {
  claimSessionLifecycleRunId,
  getSessionById,
  updateSession,
} from "../../../workflows/impl/db-sessions";
import {
  getLifecycleDueAtMs,
  type SandboxLifecycleReason,
} from "../../../workflows/impl/sandbox-lifecycle";
import { sandboxLifecycleWorkflow } from "../../../workflows/sandbox-lifecycle";

const SANDBOX_LIFECYCLE_STALE_RUN_GRACE_MS = 2 * 60 * 1000;

function createLifecycleRunId(): string {
  return `lifecycle:${Date.now()}:${crypto.randomUUID()}`;
}

type SessionRecord = Awaited<ReturnType<typeof getSessionById>>;

function shouldStartLifecycle(
  session: SessionRecord,
): session is NonNullable<SessionRecord> {
  if (!session) {
    return false;
  }
  if (session.status === "archived" || session.lifecycleState === "archived") {
    return false;
  }
  if (!session.sandboxState) {
    return false;
  }
  if (!canOperateOnSandbox(session.sandboxState)) {
    return false;
  }
  if (
    session.sandboxState.type !== "vercel" &&
    session.sandboxState.type !== "just-bash"
  ) {
    return false;
  }
  if (session.sandboxState.type === "just-bash") {
    return false;
  }
  if (session.lifecycleRunId) {
    return false;
  }
  return true;
}

function isLifecycleRunStale(session: NonNullable<SessionRecord>): boolean {
  if (!session.lifecycleRunId) {
    return false;
  }
  if (session.lifecycleState !== "active") {
    return false;
  }
  const dueAtMs = getLifecycleDueAtMs(session);
  const overdueMs = Date.now() - dueAtMs;
  return overdueMs > SANDBOX_LIFECYCLE_STALE_RUN_GRACE_MS;
}

async function kick(
  sessionId: string,
  reason: SandboxLifecycleReason,
): Promise<void> {
  const session = await getSessionById(sessionId);
  if (!session) {
    return;
  }

  const sessionForStart = isLifecycleRunStale(session)
    ? { ...session, lifecycleRunId: null }
    : session;

  if (sessionForStart !== session) {
    await updateSession(sessionId, { lifecycleRunId: null });
  }

  if (!shouldStartLifecycle(sessionForStart)) {
    return;
  }

  const runId = createLifecycleRunId();
  const claimed = await claimSessionLifecycleRunId(sessionId, runId);
  if (!claimed) {
    return;
  }

  try {
    const run = await start(sandboxLifecycleWorkflow, [
      sessionId,
      reason,
      runId,
    ]);
    console.log(
      `[Lifecycle] Started workflow run ${run.runId} for session ${sessionId} (reason=${reason}, lease=${runId}).`,
    );
  } catch (error) {
    console.error(
      `[Lifecycle] Failed to start workflow run for session ${sessionId}; releasing lease:`,
      error,
    );
    await updateSession(sessionId, { lifecycleRunId: null });
  }
}

const VALID_REASONS: ReadonlySet<SandboxLifecycleReason> = new Set([
  "sandbox-created",
  "timeout-extended",
  "snapshot-restored",
  "reconnect",
  "manual-stop",
  "status-check-overdue",
]);

export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event);
  if (auth instanceof Response) {
    return auth;
  }

  const body = (await readBody(event)) as {
    sessionId?: string;
    reason?: SandboxLifecycleReason;
  } | null;

  const sessionId = body?.sessionId?.trim();
  const reason = body?.reason;
  if (!sessionId) {
    return new Response(JSON.stringify({ error: "sessionId is required" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }
  if (!reason || !VALID_REASONS.has(reason)) {
    return new Response(JSON.stringify({ error: "invalid reason" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  void kick(sessionId, reason).catch((err) => {
    console.error(`[Lifecycle] kick failed for session ${sessionId}:`, err);
  });

  return { ok: true };
});
