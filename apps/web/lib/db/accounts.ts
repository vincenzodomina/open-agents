import { nanoid } from "nanoid";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { parseTimestamp } from "./maps";

export async function upsertGitHubAccount(data: {
  userId: string;
  externalUserId: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  scope?: string;
  username: string;
}): Promise<string> {
  const sb = getSupabaseAdmin();

  const { data: existing, error: findErr } = await sb
    .from("accounts")
    .select("id")
    .eq("user_id", data.userId)
    .eq("provider", "github")
    .maybeSingle();

  if (findErr) {
    throw findErr;
  }

  if (existing?.id) {
    const { error } = await sb
      .from("accounts")
      .update({
        external_user_id: data.externalUserId,
        access_token: data.accessToken,
        refresh_token: data.refreshToken ?? null,
        expires_at: data.expiresAt?.toISOString() ?? null,
        scope: data.scope ?? null,
        username: data.username,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    if (error) {
      throw error;
    }
    return existing.id;
  }

  const id = nanoid();
  const now = new Date().toISOString();
  const { error } = await sb.from("accounts").insert({
    id,
    user_id: data.userId,
    provider: "github",
    external_user_id: data.externalUserId,
    access_token: data.accessToken,
    refresh_token: data.refreshToken ?? null,
    expires_at: data.expiresAt?.toISOString() ?? null,
    scope: data.scope ?? null,
    username: data.username,
    created_at: now,
    updated_at: now,
  });

  if (error) {
    throw error;
  }
  return id;
}

export async function getGitHubAccount(userId: string): Promise<{
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date | null;
  username: string;
  externalUserId: string;
} | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("accounts")
    .select(
      "access_token, refresh_token, expires_at, username, external_user_id",
    )
    .eq("user_id", userId)
    .eq("provider", "github")
    .maybeSingle();

  if (error) {
    throw error;
  }
  if (!data) {
    return null;
  }

  const row = data as Record<string, unknown>;
  return {
    accessToken: String(row.access_token),
    refreshToken: row.refresh_token != null ? String(row.refresh_token) : null,
    expiresAt: parseTimestamp(row.expires_at),
    username: String(row.username),
    externalUserId: String(row.external_user_id),
  };
}

export async function updateGitHubAccountTokens(
  userId: string,
  data: {
    accessToken: string;
    refreshToken?: string;
    expiresAt?: Date;
  },
): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from("accounts")
    .update({
      access_token: data.accessToken,
      refresh_token: data.refreshToken ?? null,
      expires_at: data.expiresAt?.toISOString() ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("provider", "github");

  if (error) {
    throw error;
  }
}

export async function deleteGitHubAccount(userId: string): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from("accounts")
    .delete()
    .eq("user_id", userId)
    .eq("provider", "github");

  if (error) {
    throw error;
  }
}
