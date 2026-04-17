import { describe, expect, mock, test } from "bun:test";

mock.module("@/lib/supabase/admin", () => ({
  getSupabaseAdmin: () => ({
    rpc: mock(() => Promise.resolve({ data: null, error: null })),
    from: mock(() => ({})),
  }),
}));

const { GitHubInstallationsSyncError, isGitHubInstallationsAuthError } =
  await import("./installations-sync");

describe("isGitHubInstallationsAuthError", () => {
  test("treats 401 responses as auth failures", () => {
    expect(
      isGitHubInstallationsAuthError(
        new GitHubInstallationsSyncError("Unauthorized", {
          status: 401,
          responseText: '{"message":"Bad credentials"}',
        }),
      ),
    ).toBe(true);
  });

  test("treats auth-specific 403 responses as auth failures", () => {
    expect(
      isGitHubInstallationsAuthError(
        new GitHubInstallationsSyncError("Forbidden", {
          status: 403,
          responseText:
            '{"message":"Must grant your OAuth app access to this organization."}',
        }),
      ),
    ).toBe(true);
  });

  test("does not treat rate-limited 403 responses as auth failures", () => {
    expect(
      isGitHubInstallationsAuthError(
        new GitHubInstallationsSyncError("Forbidden", {
          status: 403,
          responseText:
            '{"message":"API rate limit exceeded for user ID 123."}',
        }),
      ),
    ).toBe(false);
  });
});
