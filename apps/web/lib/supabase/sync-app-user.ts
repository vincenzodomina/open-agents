import type { Session } from "@supabase/supabase-js";
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

  const userId = await upsertUser({
    supabaseUserId: user.id,
    username,
    email: user.email ?? undefined,
    name,
    avatarUrl,
  });

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
