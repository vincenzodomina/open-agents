import { nanoid } from "nanoid";
import {
  countSessionsByUserId,
  createSessionWithInitialChat,
  getArchivedSessionCountByUserId,
  getSessionsWithUnreadByUserId,
  getUsedSessionTitles,
} from "@/lib/db/sessions";
import { getUserPreferences } from "@/lib/db/user-preferences";
import { sanitizeUserPreferencesForSession } from "@/lib/model-access";
import { getRandomCityName } from "@/lib/random-city";
import { getServerSession } from "@/lib/session/get-server-session";
import {
  isManagedTemplateTrialUser,
  MANAGED_TEMPLATE_TRIAL_SESSION_LIMIT,
  MANAGED_TEMPLATE_TRIAL_SESSION_LIMIT_ERROR,
} from "@/lib/managed-template-trial";

interface CreateSessionRequest {
  title?: string;
  sandboxType?: "just-bash" | "vercel";
}

async function resolveSessionTitle(
  input: CreateSessionRequest,
  userId: string,
): Promise<string> {
  if (input.title && input.title.trim()) {
    return input.title.trim();
  }
  const usedNames = await getUsedSessionTitles(userId);
  return getRandomCityName(usedNames);
}

const DEFAULT_ARCHIVED_SESSIONS_LIMIT = 50;
const MAX_ARCHIVED_SESSIONS_LIMIT = 100;

type SessionsStatusFilter = "all" | "active" | "archived";

function parseNonNegativeInteger(value: string | null): number | null {
  if (value === null) {
    return null;
  }

  if (!/^[0-9]+$/.test(value)) {
    return null;
  }

  return Number(value);
}

export async function GET(req: Request) {
  const session = await getServerSession();
  if (!session?.user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const rawStatus = searchParams.get("status");
    if (
      rawStatus !== null &&
      rawStatus !== "all" &&
      rawStatus !== "active" &&
      rawStatus !== "archived"
    ) {
      return Response.json({ error: "Invalid status filter" }, { status: 400 });
    }

    const statusParam: SessionsStatusFilter = rawStatus ?? "all";

    if (statusParam === "archived") {
      const rawLimit = parseNonNegativeInteger(searchParams.get("limit"));
      const rawOffset = parseNonNegativeInteger(searchParams.get("offset"));

      if (searchParams.get("limit") !== null && rawLimit === null) {
        return Response.json(
          { error: "Invalid archived limit" },
          { status: 400 },
        );
      }

      if (searchParams.get("offset") !== null && rawOffset === null) {
        return Response.json(
          { error: "Invalid archived offset" },
          { status: 400 },
        );
      }

      const limit = Math.min(
        Math.max(rawLimit ?? DEFAULT_ARCHIVED_SESSIONS_LIMIT, 1),
        MAX_ARCHIVED_SESSIONS_LIMIT,
      );
      const offset = rawOffset ?? 0;

      const [sessions, archivedCount] = await Promise.all([
        getSessionsWithUnreadByUserId(session.user.id, {
          status: "archived",
          limit,
          offset,
        }),
        getArchivedSessionCountByUserId(session.user.id),
      ]);

      return Response.json({
        sessions,
        archivedCount,
        pagination: {
          limit,
          offset,
          hasMore: offset + sessions.length < archivedCount,
          nextOffset: offset + sessions.length,
        },
      });
    }

    if (statusParam === "active") {
      const [sessions, archivedCount] = await Promise.all([
        getSessionsWithUnreadByUserId(session.user.id, {
          status: "active",
        }),
        getArchivedSessionCountByUserId(session.user.id),
      ]);

      return Response.json({ sessions, archivedCount });
    }

    const sessions = await getSessionsWithUnreadByUserId(session.user.id);
    return Response.json({ sessions });
  } catch (cause) {
    console.error(
      "[GET /api/sessions]",
      cause instanceof Error ? cause.message : cause,
    );
    return Response.json(
      {
        error: "Failed to load sessions",
        code: "SESSIONS_LIST_FAILED",
      },
      { status: 503 },
    );
  }
}

export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session?.user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (isManagedTemplateTrialUser(session, req.url)) {
    const existingSessionCount = await countSessionsByUserId(session.user.id);
    if (existingSessionCount >= MANAGED_TEMPLATE_TRIAL_SESSION_LIMIT) {
      return Response.json(
        { error: MANAGED_TEMPLATE_TRIAL_SESSION_LIMIT_ERROR },
        { status: 403 },
      );
    }
  }

  let body: CreateSessionRequest;
  try {
    body = (await req.json()) as CreateSessionRequest;
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
  const { sandboxType = "just-bash" } = body;

  try {
    const titlePromise = resolveSessionTitle(body, session.user.id);
    const preferencesPromise = getUserPreferences(session.user.id);

    const [title, rawPreferences] = await Promise.all([
      titlePromise,
      preferencesPromise,
    ]);
    const preferences = sanitizeUserPreferencesForSession(
      rawPreferences,
      session,
      req.url,
    );
    const result = await createSessionWithInitialChat({
      session: {
        id: nanoid(),
        userId: session.user.id,
        title,
        status: "running",
        repoOwner: null,
        repoName: null,
        branch: null,
        cloneUrl: null,
        isNewBranch: false,
        autoCommitPushOverride: false,
        autoCreatePrOverride: false,
        globalSkillRefs: [],
        sandboxState: { type: sandboxType },
        lifecycleState: "provisioning",
        lifecycleVersion: 0,
      },
      initialChat: {
        id: nanoid(),
        title: "New chat",
        modelId: preferences.defaultModelId,
      },
    });

    return Response.json(result);
  } catch (error) {
    console.error("Failed to create session:", error);
    return Response.json(
      { error: "Failed to create session" },
      { status: 500 },
    );
  }
}
