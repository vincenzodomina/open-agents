import { spawn } from "node:child_process";
import { mkdir, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import type { Source } from "../types";

export const JUST_BASH_WORKING_DIRECTORY = "/vercel/sandbox";

export interface BootstrapParams {
  rootPath: string;
  source?: Source;
  gitUser?: { name: string; email: string };
  githubToken?: string;
  skipGitWorkspaceBootstrap?: boolean;
}

function buildAuthenticatedGitHubUrl(
  repoUrl: string,
  token: string,
): string | null {
  const githubUrlMatch = repoUrl.match(
    /github\.com[/:]([^/]+)\/([^/]+?)(?:\.git)?$/,
  );
  if (!githubUrlMatch) {
    return null;
  }
  const [, owner, repo] = githubUrlMatch;
  return `https://x-access-token:${token}@github.com/${owner}/${repo}.git`;
}

function runGit(
  args: string[],
  cwd: string,
): Promise<{ code: number; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn("git", args, {
      cwd,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stderr = "";
    child.stderr?.setEncoding("utf8");
    child.stderr?.on("data", (chunk: string) => {
      stderr += chunk;
    });

    child.on("error", reject);
    child.on("close", (code, signal) => {
      resolve({
        code: code ?? (signal ? 1 : 0),
        stderr,
      });
    });
  });
}

/**
 * Prepares a real directory on the host using the real `git` binary, then mounts it into
 * just-bash via ReadWriteFs (just-bash does not ship `git` as a shell command).
 */
export async function bootstrapHostGitWorkspace(
  params: BootstrapParams,
): Promise<{ currentBranch?: string }> {
  const { rootPath, source, gitUser, githubToken, skipGitWorkspaceBootstrap } =
    params;

  let currentBranch: string | undefined;

  const cloneToken = source?.token ?? githubToken;

  if (source) {
    const cloneUrl =
      cloneToken !== undefined
        ? (buildAuthenticatedGitHubUrl(source.repo, cloneToken) ?? source.repo)
        : source.repo;

    const cloneArgs = ["clone"];
    if (source.branch) {
      cloneArgs.push("--branch", source.branch);
    }
    cloneArgs.push(cloneUrl, ".");

    const cloneResult = await runGit(cloneArgs, rootPath);
    if (cloneResult.code !== 0) {
      throw new Error(
        `Failed to clone repository '${source.repo}' (exit code ${cloneResult.code}): ${cloneResult.stderr}`,
      );
    }

    if (cloneToken !== undefined) {
      const authenticatedUrl = buildAuthenticatedGitHubUrl(
        source.repo,
        cloneToken,
      );
      if (authenticatedUrl !== null) {
        await runGit(
          ["remote", "set-url", "origin", authenticatedUrl],
          rootPath,
        );
      }
    }

    if (source.newBranch !== undefined) {
      const checkoutResult = await runGit(
        ["checkout", "-b", source.newBranch],
        rootPath,
      );
      if (checkoutResult.code !== 0) {
        throw new Error(
          `Failed to create branch '${source.newBranch}': ${checkoutResult.stderr}`,
        );
      }
      currentBranch = source.newBranch;
    } else if (source.branch !== undefined) {
      currentBranch = source.branch;
    }
  } else if (!skipGitWorkspaceBootstrap) {
    await runGit(["init"], rootPath);

    if (gitUser) {
      await runGit(["config", "user.name", gitUser.name], rootPath);
      await runGit(["config", "user.email", gitUser.email], rootPath);
    }

    if (gitUser) {
      await runGit(
        ["commit", "--allow-empty", "-m", "Initial commit"],
        rootPath,
      );
    }
  }

  return { currentBranch };
}

export async function allocateWorkspaceDirectory(
  sandboxName?: string,
): Promise<string> {
  if (
    sandboxName !== undefined &&
    sandboxName !== "" &&
    sandboxName !== "unknown"
  ) {
    const dir = path.join(tmpdir(), "open-harness-jb", sandboxName);
    await mkdir(dir, { recursive: true });
    return dir;
  }

  return mkdtemp(path.join(tmpdir(), "jb-ws-"));
}
