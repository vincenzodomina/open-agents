import type { Session } from "@supabase/supabase-js";
import { encrypt } from "@open-harness/shared/lib/crypto";
import { upsertUser } from "@/lib/db/users";
import type { Session as AppSession } from "@/lib/session/types";

function readMetaString(
  meta: Record<string, unknown>,
  key: string,
): string | undefined {
  const v = meta[key];
  return typeof v === "string" ? v : undefined;
}

export async function syncAppUserFromSupabase(
  session: Session,
): Promise<AppSession> {
  const user = session.user;
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const username =
    readMetaString(meta, "preferred_username") ??
    readMetaString(meta, "user_name") ??
    user.email?.split("@")[0] ??
    user.id;
  const name =
    readMetaString(meta, "full_name") ??
    readMetaString(meta, "name") ??
    username;
  const avatarRaw =
    readMetaString(meta, "avatar_url") ?? readMetaString(meta, "picture") ?? "";
  const avatarUrl = avatarRaw || undefined;

  const userId = await upsertUser(
    {
      provider: "supabase",
      externalId: user.id,
      accessToken: encrypt(session.access_token),
      refreshToken: session.refresh_token
        ? encrypt(session.refresh_token)
        : undefined,
      scope: undefined,
      username,
      email: user.email ?? undefined,
      name,
      avatarUrl,
      tokenExpiresAt: session.expires_at
        ? new Date(session.expires_at * 1000)
        : undefined,
    },
    { fixedUserId: user.id },
  );

  return {
    created: Date.now(),
    authProvider: "supabase",
    user: {
      id: userId,
      username,
      email: user.email,
      name,
      avatar: avatarUrl ?? "",
    },
  };
}
