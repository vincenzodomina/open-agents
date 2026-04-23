import { getSupabaseAdmin } from "./supabase-admin";

export type GitHubAccount = {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date | null;
  username: string;
  externalUserId: string;
};

function parseTimestamp(value: unknown): Date | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (value instanceof Date) {
    return value;
  }
  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

export async function getGitHubAccount(
  userId: string,
): Promise<GitHubAccount | null> {
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
