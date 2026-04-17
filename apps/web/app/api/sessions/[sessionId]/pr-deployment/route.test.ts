import { beforeEach, describe, expect, mock, test } from "bun:test";

const currentSessionRecord = {
  userId: "user-1",
  repoOwner: "vercel",
  repoName: "open-harness",
  branch: "feature/preview",
  prNumber: null as number | null,
};

let currentPullRequestDeploymentResult: {
  success: boolean;
  deploymentUrl?: string | null;
} = {
  success: false,
};

const getUserGitHubTokenMock = mock(async () => "repo-token");
const findLatestVercelDeploymentUrlForPullRequestMock = mock(
  async () => currentPullRequestDeploymentResult,
);

mock.module("@/app/api/sessions/_lib/session-context", () => ({
  requireAuthenticatedUser: async () => ({
    ok: true,
    userId: "user-1",
  }),
  requireOwnedSession: async () => ({
    ok: true,
    sessionRecord: currentSessionRecord,
  }),
}));

mock.module("@/lib/github/user-token", () => ({
  getUserGitHubToken: getUserGitHubTokenMock,
}));

mock.module("@/lib/github/client", () => ({
  findLatestVercelDeploymentUrlForPullRequest:
    findLatestVercelDeploymentUrlForPullRequestMock,
}));

const routeModulePromise = import("./route");

function createRouteContext(sessionId = "session-1") {
  return {
    params: Promise.resolve({ sessionId }),
  };
}

describe("/api/sessions/[sessionId]/pr-deployment", () => {
  beforeEach(() => {
    currentSessionRecord.repoOwner = "vercel";
    currentSessionRecord.repoName = "open-harness";
    currentSessionRecord.branch = "feature/preview";
    currentSessionRecord.prNumber = null;
    currentPullRequestDeploymentResult = { success: false };
    getUserGitHubTokenMock.mockClear();
    findLatestVercelDeploymentUrlForPullRequestMock.mockClear();
  });

  test("returns null when the session has no PR yet", async () => {
    const { GET } = await routeModulePromise;
    const response = await GET(
      new Request("http://localhost/api/sessions/session-1/pr-deployment"),
      createRouteContext(),
    );
    const body = (await response.json()) as { deploymentUrl: string | null };
    expect(response.status).toBe(200);
    expect(body.deploymentUrl).toBeNull();
    expect(getUserGitHubTokenMock).toHaveBeenCalledTimes(0);
    expect(
      findLatestVercelDeploymentUrlForPullRequestMock,
    ).toHaveBeenCalledTimes(0);
  });

  test("uses the PR-based lookup when the session already has a PR", async () => {
    const { GET } = await routeModulePromise;

    currentSessionRecord.prNumber = 42;
    currentPullRequestDeploymentResult = {
      success: true,
      deploymentUrl: "https://pr-preview.vercel.app",
    };

    const response = await GET(
      new Request(
        "http://localhost/api/sessions/session-1/pr-deployment?prNumber=42&branch=feature/preview",
      ),
      createRouteContext(),
    );
    const body = (await response.json()) as { deploymentUrl: string | null };

    expect(response.status).toBe(200);
    expect(body.deploymentUrl).toBe("https://pr-preview.vercel.app");
    expect(getUserGitHubTokenMock).toHaveBeenCalledTimes(1);
    expect(
      findLatestVercelDeploymentUrlForPullRequestMock,
    ).toHaveBeenCalledWith({
      owner: "vercel",
      repo: "open-harness",
      prNumber: 42,
      token: "repo-token",
    });
  });

  test("does not return failedDeploymentUrl for PR-based lookups", async () => {
    const { GET } = await routeModulePromise;

    currentSessionRecord.prNumber = 42;
    currentPullRequestDeploymentResult = {
      success: true,
      deploymentUrl: "https://pr-preview.vercel.app",
    };

    const response = await GET(
      new Request(
        "http://localhost/api/sessions/session-1/pr-deployment?prNumber=42&branch=feature/preview",
      ),
      createRouteContext(),
    );
    const body = (await response.json()) as {
      deploymentUrl: string | null;
      failedDeploymentUrl?: string | null;
    };

    expect(response.status).toBe(200);
    expect(body.deploymentUrl).toBe("https://pr-preview.vercel.app");
    expect(body.failedDeploymentUrl).toBeUndefined();
  });
});
