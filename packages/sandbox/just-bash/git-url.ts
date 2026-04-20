export function scrubHttpsCredentials(url: string): string | undefined {
  try {
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      return undefined;
    }
    const parsed = new URL(url);
    if (!parsed.username && !parsed.password) {
      return undefined;
    }
    parsed.username = "";
    parsed.password = "";
    return parsed.href;
  } catch {
    return undefined;
  }
}

export function normalizeGithubHttpsWebUrl(url: string): string {
  return url
    .trim()
    .replace(/^https:\/\/www\.github\.com(?=\/)/i, "https://github.com");
}

export function publicGitHubHttpsUrl(repoUrl: string): string | null {
  const normalized = normalizeGithubHttpsWebUrl(repoUrl);
  const match = normalized.match(/github\.com[/:]([^/]+)\/([^/]+?)(?:\.git)?$/);
  if (!match) {
    return null;
  }
  const [, owner, repo] = match;
  return `https://github.com/${owner}/${repo}.git`;
}
