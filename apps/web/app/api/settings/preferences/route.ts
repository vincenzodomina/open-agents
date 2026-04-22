import { getServerSession } from "@/lib/session/get-server-session";
import {
  getUserPreferences,
  type DiffMode,
  updateUserPreferences,
} from "@/lib/db/user-preferences";
import { sanitizeUserPreferencesForSession } from "@/lib/model-access";
import type { SandboxType } from "@/components/sandbox-selector-compact";

interface UpdatePreferencesRequest {
  defaultModelId?: string;
  defaultSubagentModelId?: string | null;
  defaultSandboxType?: SandboxType;
  defaultDiffMode?: DiffMode;
  alertsEnabled?: boolean;
  alertSoundEnabled?: boolean;
  enabledModelIds?: string[];
}

export async function GET(req: Request) {
  const session = await getServerSession();
  if (!session?.user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const preferences = sanitizeUserPreferencesForSession(
    await getUserPreferences(session.user.id),
    session,
    req.url,
  );
  return Response.json({ preferences });
}

export async function PATCH(req: Request) {
  const session = await getServerSession();
  if (!session?.user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: UpdatePreferencesRequest;
  try {
    body = (await req.json()) as UpdatePreferencesRequest;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (body.defaultSandboxType !== undefined) {
    const validTypes = ["just-bash", "vercel"];
    if (
      typeof body.defaultSandboxType !== "string" ||
      !validTypes.includes(body.defaultSandboxType)
    ) {
      return Response.json({ error: "Invalid sandbox type" }, { status: 400 });
    }
  }

  if (body.defaultDiffMode !== undefined) {
    const validDiffModes = ["unified", "split"];
    if (
      typeof body.defaultDiffMode !== "string" ||
      !validDiffModes.includes(body.defaultDiffMode)
    ) {
      return Response.json({ error: "Invalid diff mode" }, { status: 400 });
    }
  }

  if (
    body.alertsEnabled !== undefined &&
    typeof body.alertsEnabled !== "boolean"
  ) {
    return Response.json(
      { error: "Invalid alertsEnabled value" },
      { status: 400 },
    );
  }

  if (
    body.alertSoundEnabled !== undefined &&
    typeof body.alertSoundEnabled !== "boolean"
  ) {
    return Response.json(
      { error: "Invalid alertSoundEnabled value" },
      { status: 400 },
    );
  }

  if (body.enabledModelIds !== undefined) {
    if (
      !Array.isArray(body.enabledModelIds) ||
      !body.enabledModelIds.every((id) => typeof id === "string")
    ) {
      return Response.json(
        { error: "Invalid enabledModelIds value" },
        { status: 400 },
      );
    }
  }

  try {
    const preferences = sanitizeUserPreferencesForSession(
      await updateUserPreferences(session.user.id, body),
      session,
      req.url,
    );
    return Response.json({ preferences });
  } catch (error) {
    console.error("Failed to update preferences:", error);
    return Response.json(
      { error: "Failed to update preferences" },
      { status: 500 },
    );
  }
}
