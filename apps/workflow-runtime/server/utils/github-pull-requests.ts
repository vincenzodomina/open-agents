import { Octokit } from "@octokit/rest";

function parseGitHubUrl(
  repoUrl: string,
): { owner: string; repo: string } | null {
  const match = repoUrl.match(/github\.com[/:]([.\w-]+)\/([.\w-]+?)(\.git)?$/);
  if (match?.[1] && match[2]) {
    return { owner: match[1], repo: match[2] };
  }
  return null;
}

export async function createPullRequest(params: {
  repoUrl: string;
  branchName: string;
  headRef?: string;
  title: string;
  body?: string;
  baseBranch?: string;
  isDraft?: boolean;
  token: string;
}): Promise<{
  success: boolean;
  prUrl?: string;
  prNumber?: number;
  nodeId?: string;
  error?: string;
}> {
  const {
    repoUrl,
    branchName,
    headRef,
    title,
    body = "",
    baseBranch = "main",
    isDraft = false,
    token,
  } = params;

  try {
    const octokit = new Octokit({ auth: token });
    const parsed = parseGitHubUrl(repoUrl);
    if (!parsed) {
      return { success: false, error: "Invalid GitHub repository URL" };
    }
    const { owner, repo } = parsed;

    const response = await octokit.rest.pulls.create({
      owner,
      repo,
      title,
      body,
      head: headRef ?? branchName,
      base: baseBranch,
      draft: isDraft,
    });

    return {
      success: true,
      prUrl: response.data.html_url,
      prNumber: response.data.number,
      nodeId: response.data.node_id,
    };
  } catch (error: unknown) {
    console.error("Error creating PR:", error);
    const httpError = error as { status?: number };
    if (httpError.status === 422) {
      return { success: false, error: "PR already exists or branch not found" };
    }
    if (httpError.status === 403) {
      return { success: false, error: "Permission denied" };
    }
    if (httpError.status === 404) {
      return { success: false, error: "Repository not found or no access" };
    }
    return { success: false, error: "Failed to create pull request" };
  }
}

export async function findPullRequestByBranch(params: {
  owner: string;
  repo: string;
  branchName: string;
  token: string;
}): Promise<{
  found: boolean;
  prNumber?: number;
  prStatus?: "open" | "closed" | "merged";
  prUrl?: string;
  prTitle?: string;
  error?: string;
}> {
  const { owner, repo, branchName, token } = params;

  try {
    const octokit = new Octokit({ auth: token });
    const response = await octokit.rest.pulls.list({
      owner,
      repo,
      head: `${owner}:${branchName}`,
      state: "all",
      per_page: 1,
      sort: "updated",
      direction: "desc",
    });

    const pr = response.data[0];
    if (!pr) {
      return { found: false };
    }

    let prStatus: "open" | "closed" | "merged";
    if (pr.merged_at) {
      prStatus = "merged";
    } else if (pr.state === "closed") {
      prStatus = "closed";
    } else {
      prStatus = "open";
    }

    return {
      found: true,
      prNumber: pr.number,
      prStatus,
      prUrl: pr.html_url,
      prTitle: pr.title,
    };
  } catch {
    return { found: false, error: "Failed to search pull requests" };
  }
}
