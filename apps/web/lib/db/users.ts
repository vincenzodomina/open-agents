import { nanoid } from "nanoid";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function userExists(userId: string): Promise<boolean> {
  const { data, error } = await getSupabaseAdmin()
    .from("users")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }
  return data != null;
}

export async function upsertUser(
  userData: {
    provider: "github" | "vercel" | "supabase";
    externalId: string;
    accessToken: string;
    refreshToken?: string;
    scope?: string;
    username: string;
    email?: string;
    name?: string;
    avatarUrl?: string;
    tokenExpiresAt?: Date;
  },
  options?: { fixedUserId?: string },
): Promise<string> {
  const sb = getSupabaseAdmin();
  const {
    provider,
    externalId,
    accessToken,
    refreshToken,
    scope,
    tokenExpiresAt,
  } = userData;

  const { data: existing, error: findErr } = await sb
    .from("users")
    .select("id")
    .eq("provider", provider)
    .eq("external_id", externalId)
    .maybeSingle();

  if (findErr) {
    throw findErr;
  }

  if (existing?.id) {
    const { error: updErr } = await sb
      .from("users")
      .update({
        access_token: accessToken,
        refresh_token: refreshToken ?? null,
        scope: scope ?? null,
        token_expires_at: tokenExpiresAt?.toISOString() ?? null,
        username: userData.username,
        email: userData.email ?? null,
        name: userData.name ?? null,
        avatar_url: userData.avatarUrl ?? null,
        updated_at: new Date().toISOString(),
        last_login_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    if (updErr) {
      throw updErr;
    }
    return existing.id;
  }

  const userId = options?.fixedUserId ?? nanoid();
  const now = new Date().toISOString();
  const { error: insErr } = await sb.from("users").insert({
    id: userId,
    provider,
    external_id: externalId,
    access_token: accessToken,
    refresh_token: refreshToken ?? null,
    scope: scope ?? null,
    username: userData.username,
    email: userData.email ?? null,
    name: userData.name ?? null,
    avatar_url: userData.avatarUrl ?? null,
    token_expires_at: tokenExpiresAt?.toISOString() ?? null,
    created_at: now,
    updated_at: now,
    last_login_at: now,
  });

  if (insErr) {
    throw insErr;
  }
  return userId;
}
