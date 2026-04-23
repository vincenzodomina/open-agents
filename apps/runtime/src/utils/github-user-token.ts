import { decrypt, encrypt } from "@open-harness/shared/lib/crypto";
import { getGitHubAccount, updateGitHubAccountTokens } from "./github-accounts";

type GitHubTokenRefreshResponse = {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  refresh_token_expires_in: number;
  token_type: string;
  scope: string;
};

async function refreshGitHubToken(
  refreshToken: string,
): Promise<GitHubTokenRefreshResponse | null> {
  const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) return null;

  try {
    const response = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: "refresh_token",
          refresh_token: refreshToken,
        }),
      },
    );

    if (!response.ok) {
      console.error(
        `GitHub token refresh returned HTTP ${response.status}: ${response.statusText}`,
      );
      return null;
    }

    const data = (await response.json()) as
      | GitHubTokenRefreshResponse
      | { error: string; error_description?: string };

    if ("error" in data) {
      console.error(
        "GitHub token refresh failed:",
        data.error,
        data.error_description,
      );
      return null;
    }

    return data;
  } catch (error) {
    console.error("GitHub token refresh error:", error);
    return null;
  }
}

export async function getUserGitHubToken(
  userId: string,
): Promise<string | null> {
  try {
    const ghAccount = await getGitHubAccount(userId);
    if (!ghAccount?.accessToken) return null;

    if (!ghAccount.expiresAt) {
      return decrypt(ghAccount.accessToken);
    }

    const now = Date.now();
    const bufferMs = 5 * 60 * 1000;
    const isExpired = ghAccount.expiresAt.getTime() - bufferMs < now;

    if (!isExpired) {
      return decrypt(ghAccount.accessToken);
    }

    if (!ghAccount.refreshToken) {
      console.error("GitHub token expired but no refresh token available");
      return null;
    }

    const decryptedRefresh = decrypt(ghAccount.refreshToken);
    const refreshed = await refreshGitHubToken(decryptedRefresh);
    if (!refreshed) return null;

    const newExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000);
    try {
      await updateGitHubAccountTokens(userId, {
        accessToken: encrypt(refreshed.access_token),
        refreshToken: encrypt(refreshed.refresh_token),
        expiresAt: newExpiresAt,
      });
    } catch (persistError) {
      console.error("Failed to persist refreshed GitHub tokens:", persistError);
    }

    return refreshed.access_token;
  } catch (error) {
    console.error("Error fetching GitHub token:", error);
    return null;
  }
}
