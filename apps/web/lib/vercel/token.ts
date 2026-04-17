import "server-only";
import { and, eq } from "drizzle-orm";
import { decrypt } from "@/lib/crypto";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";

interface UserVercelAuthRow {
  accessToken: string;
  refreshToken: string | null;
  tokenExpiresAt: Date | null;
  externalId: string;
}

export interface UserVercelAuthInfo {
  token: string;
  expiresAt: number;
  externalId: string;
}

async function loadUserVercelAuthRow(
  userId: string,
): Promise<UserVercelAuthRow | null> {
  const result = await db
    .select({
      accessToken: users.accessToken,
      refreshToken: users.refreshToken,
      tokenExpiresAt: users.tokenExpiresAt,
      externalId: users.externalId,
    })
    .from(users)
    .where(and(eq(users.id, userId), eq(users.provider, "vercel")))
    .limit(1);

  return result[0] ?? null;
}

function toAuthInfo(params: {
  token: string;
  tokenExpiresAt: Date;
  externalId: string;
}): UserVercelAuthInfo {
  return {
    token: params.token,
    expiresAt: Math.floor(params.tokenExpiresAt.getTime() / 1000),
    externalId: params.externalId,
  };
}

/**
 * Returns a stored Vercel OAuth access token for legacy `users.provider === "vercel"` rows.
 * Does not refresh expired tokens (Supabase-only sign-in has no Vercel OAuth to renew).
 */
export async function getUserVercelAuthInfo(
  userId: string,
): Promise<UserVercelAuthInfo | null> {
  try {
    const row = await loadUserVercelAuthRow(userId);
    if (!row?.accessToken) {
      return null;
    }

    const now = Date.now();
    const tokenExpiresAtMs = row.tokenExpiresAt?.getTime() ?? null;
    if (tokenExpiresAtMs !== null && tokenExpiresAtMs < now) {
      return null;
    }

    if (row.tokenExpiresAt) {
      return toAuthInfo({
        token: decrypt(row.accessToken),
        tokenExpiresAt: row.tokenExpiresAt,
        externalId: row.externalId,
      });
    }

    const nowSec = Math.floor(Date.now() / 1000);
    return {
      token: decrypt(row.accessToken),
      expiresAt: nowSec + 86_400,
      externalId: row.externalId,
    };
  } catch (error) {
    console.error("Error fetching Vercel auth:", error);
    return null;
  }
}

/**
 * Returns a stored Vercel access token when still valid, otherwise null.
 */
export async function getUserVercelToken(
  userId: string,
): Promise<string | null> {
  const authInfo = await getUserVercelAuthInfo(userId);
  if (authInfo) {
    return authInfo.token;
  }

  try {
    const row = await loadUserVercelAuthRow(userId);
    if (!row?.accessToken || row.tokenExpiresAt) {
      return null;
    }

    return decrypt(row.accessToken);
  } catch (error) {
    console.error("Error fetching Vercel token:", error);
    return null;
  }
}
