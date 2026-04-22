import { connectSandbox, type SandboxState } from "@open-harness/sandbox";
import { verifyBotIdRequest } from "@/lib/botid-server";
import {
  requireAuthenticatedUser,
  requireOwnedSession,
  type SessionRecord,
} from "@/app/api/sessions/_lib/session-context";
import { updateSession } from "@/lib/db/sessions";
import {
  DEFAULT_SANDBOX_BASE_SNAPSHOT_ID,
  DEFAULT_SANDBOX_PORTS,
  DEFAULT_SANDBOX_TIMEOUT_MS,
} from "@/lib/sandbox/config";
import {
  buildActiveLifecycleUpdate,
  getNextLifecycleVersion,
} from "@/lib/sandbox/lifecycle";
import { kickSandboxLifecycleWorkflow } from "@/lib/sandbox/lifecycle-kick";
import type { SandboxType } from "@/components/sandbox-selector-compact";
import {
  getVercelCliSandboxSetup,
  syncVercelCliAuthToSandbox,
} from "@/lib/sandbox/vercel-cli-auth";
import { installGlobalSkills } from "@/lib/skills/global-skill-installer";
import {
  canOperateOnSandbox,
  clearSandboxState,
  getSessionSandboxName,
  hasResumableSandboxState,
} from "@/lib/sandbox/utils";
import { getServerSession } from "@/lib/session/get-server-session";

interface CreateSandboxRequest {
  repoUrl?: string;
  branch?: string;
  isNewBranch?: boolean;
  sessionId?: string;
  sandboxType?: SandboxType;
}

async function syncVercelCliAuthForSandbox(params: {
  userId: string;
  sessionRecord: SessionRecord;
  sandbox: Awaited<ReturnType<typeof connectSandbox>>;
}): Promise<void> {
  const setup = await getVercelCliSandboxSetup({
    userId: params.userId,
    sessionRecord: params.sessionRecord,
  });

  await syncVercelCliAuthToSandbox({
    sandbox: params.sandbox,
    setup,
  });
}

async function installSessionGlobalSkills(params: {
  sessionRecord: SessionRecord;
  sandbox: Awaited<ReturnType<typeof connectSandbox>>;
}): Promise<void> {
  const globalSkillRefs = params.sessionRecord.globalSkillRefs ?? [];
  if (globalSkillRefs.length === 0) {
    return;
  }

  await installGlobalSkills({
    sandbox: params.sandbox,
    globalSkillRefs,
  });
}

export async function POST(req: Request) {
  let body: CreateSandboxRequest;
  try {
    body = (await req.json()) as CreateSandboxRequest;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (
    body.sandboxType &&
    body.sandboxType !== "vercel" &&
    body.sandboxType !== "just-bash"
  ) {
    return Response.json({ error: "Invalid sandbox type" }, { status: 400 });
  }

  const { repoUrl, sessionId, sandboxType = "just-bash" } = body;

  // Get session for auth
  const session = await getServerSession();
  if (!session?.user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const botVerification = await verifyBotIdRequest();
  if (botVerification.isBot) {
    return Response.json({ error: "Access denied" }, { status: 403 });
  }

  if (repoUrl) {
    return Response.json(
      { error: "Repository-backed sandboxes are no longer supported" },
      { status: 400 },
    );
  }

  // Validate session ownership
  let sessionRecord: SessionRecord | undefined;
  if (sessionId) {
    const sessionContext = await requireOwnedSession({
      userId: session.user.id,
      sessionId,
    });
    if (!sessionContext.ok) {
      return sessionContext.response;
    }

    sessionRecord = sessionContext.sessionRecord;
  }

  const sandboxName = sessionId ? getSessionSandboxName(sessionId) : undefined;

  // ============================================
  // CREATE OR RESUME: Create a named persistent sandbox for this session.
  // ============================================
  const startTime = Date.now();
  const sandboxTimeout =
    sandboxType === "vercel" ? DEFAULT_SANDBOX_TIMEOUT_MS : undefined;

  try {
    const sandbox = await connectSandbox({
      state: {
        type: sandboxType,
        ...(sandboxName ? { sandboxName } : {}),
      },
      options: {
        ...(sandboxTimeout !== undefined ? { timeout: sandboxTimeout } : {}),
        ports: DEFAULT_SANDBOX_PORTS,
        ...(sandboxType === "vercel"
          ? { baseSnapshotId: DEFAULT_SANDBOX_BASE_SNAPSHOT_ID }
          : {}),
        persistent: !!sandboxName,
        resume: !!sandboxName,
        createIfMissing: !!sandboxName,
      },
    });

    const nextState = sandbox.getState?.() as SandboxState | undefined;
    if (sessionId && nextState) {
      await updateSession(sessionId, {
        sandboxState: nextState,
        snapshotUrl: null,
        snapshotCreatedAt: null,
        lifecycleVersion: getNextLifecycleVersion(
          sessionRecord?.lifecycleVersion,
        ),
        ...buildActiveLifecycleUpdate(nextState),
      });

      if (sessionRecord) {
        try {
          await syncVercelCliAuthForSandbox({
            userId: session.user.id,
            sessionRecord,
            sandbox,
          });
        } catch (error) {
          console.error(
            `Failed to prepare Vercel CLI auth for session ${sessionRecord.id}:`,
            error,
          );
        }

        try {
          await installSessionGlobalSkills({
            sessionRecord,
            sandbox,
          });
        } catch (error) {
          console.error(
            `Failed to install global skills for session ${sessionRecord.id}:`,
            error,
          );
        }
      }

      kickSandboxLifecycleWorkflow({
        sessionId,
        reason: "sandbox-created",
      });
    }

    const readyMs = Date.now() - startTime;

    return Response.json({
      createdAt: Date.now(),
      timeout:
        sandbox.timeout ??
        (sandboxType === "vercel" ? DEFAULT_SANDBOX_TIMEOUT_MS : null),
      mode: sandboxType,
      timing: { readyMs },
    });
  } catch (error) {
    const message =
      error instanceof Error && error.message.trim().length > 0
        ? error.message
        : "Failed to create sandbox. Please try again.";
    console.error(
      `[Sandbox] Failed to create ${sandboxType} sandbox${sessionId ? ` for session ${sessionId}` : ""}:`,
      error,
    );
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const authResult = await requireAuthenticatedUser();
  if (!authResult.ok) {
    return authResult.response;
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (
    !body ||
    typeof body !== "object" ||
    !("sessionId" in body) ||
    typeof (body as Record<string, unknown>).sessionId !== "string"
  ) {
    return Response.json({ error: "Missing sessionId" }, { status: 400 });
  }

  const { sessionId } = body as { sessionId: string };

  const sessionContext = await requireOwnedSession({
    userId: authResult.userId,
    sessionId,
  });
  if (!sessionContext.ok) {
    return sessionContext.response;
  }

  const { sessionRecord } = sessionContext;

  // If there's no sandbox to stop, return success (idempotent)
  if (!canOperateOnSandbox(sessionRecord.sandboxState)) {
    return Response.json({ success: true, alreadyStopped: true });
  }

  // Connect and stop using unified API
  const sandbox = await connectSandbox(sessionRecord.sandboxState);
  await sandbox.stop();

  const clearedState = clearSandboxState(sessionRecord.sandboxState);
  await updateSession(sessionId, {
    sandboxState: clearedState,
    snapshotUrl: null,
    snapshotCreatedAt: null,
    lifecycleState:
      hasResumableSandboxState(clearedState) || !!sessionRecord.snapshotUrl
        ? "hibernated"
        : "provisioning",
    sandboxExpiresAt: null,
    hibernateAfter: null,
    lifecycleRunId: null,
    lifecycleError: null,
  });

  return Response.json({ success: true });
}
