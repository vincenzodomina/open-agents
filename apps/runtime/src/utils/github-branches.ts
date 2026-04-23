type GitHubBranch = { name: string };
type GitHubRepoInfo = { default_branch: string };

function normalizeGitHubLimit(limit: number | undefined): number | undefined {
  return typeof limit === "number" && Number.isFinite(limit)
    ? Math.max(1, Math.min(limit, 100))
    : undefined;
}

async function fetchGitHubAPI<T>(
  endpoint: string,
  token: string,
): Promise<T | null> {
  const response = await fetch(`https://api.github.com${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
    },
  });
  if (!response.ok) {
    return null;
  }
  return response.json() as Promise<T>;
}

export async function fetchGitHubBranches(
  token: string,
  owner: string,
  repo: string,
  limit?: number,
): Promise<{ branches: string[]; defaultBranch: string } | null> {
  const repoInfo = await fetchGitHubAPI<GitHubRepoInfo>(
    `/repos/${owner}/${repo}`,
    token,
  );
  if (!repoInfo) return null;

  const defaultBranch = repoInfo.default_branch;
  const normalizedLimit = normalizeGitHubLimit(limit);

  const allBranches: string[] = [];
  let page = 1;
  const perPage = normalizedLimit ?? 100;
  const maxPages = normalizedLimit ? 1 : 50;

  while (page <= maxPages) {
    const branches = await fetchGitHubAPI<GitHubBranch[]>(
      `/repos/${owner}/${repo}/branches?per_page=${perPage}&page=${page}`,
      token,
    );

    if (!branches) {
      if (page === 1) return null;
      break;
    }
    if (branches.length === 0) break;

    allBranches.push(...branches.map((b) => b.name));
    if (normalizedLimit && allBranches.length >= normalizedLimit) {
      break;
    }
    if (branches.length < perPage) break;
    page++;
  }

  if (normalizedLimit && !allBranches.includes(defaultBranch)) {
    allBranches.push(defaultBranch);
  }

  allBranches.sort((a, b) => {
    if (a === defaultBranch) return -1;
    if (b === defaultBranch) return 1;
    return a.toLowerCase().localeCompare(b.toLowerCase());
  });

  return {
    branches: normalizedLimit
      ? allBranches.slice(0, normalizedLimit)
      : allBranches,
    defaultBranch,
  };
}
