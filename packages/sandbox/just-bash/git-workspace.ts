import git from "isomorphic-git";
import http from "isomorphic-git/http/node";

import type { IFileSystem } from "just-bash";

import type { Source } from "../types";
import { JUST_BASH_WORKING_DIRECTORY } from "./constants";
import { createFsClientFromIFileSystem } from "./isomorphic-git-fs";

export interface BootstrapGitWorkspaceParams {
  vfs: IFileSystem;
  dir?: string;
  source?: Source;
  gitUser?: { name: string; email: string };
  githubToken?: string;
  skipGitWorkspaceBootstrap?: boolean;
}

export function buildAuthenticatedGitHubUrl(
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

const INIT_PLACEHOLDER = ".open-harness-git-placeholder";

/**
 * Initializes or clones a repository into the just-bash workspace using isomorphic-git (no host `git`).
 */
export async function bootstrapJustBashGitWorkspace(
  params: BootstrapGitWorkspaceParams,
): Promise<{ currentBranch?: string }> {
  const { vfs, source, gitUser, githubToken, skipGitWorkspaceBootstrap } =
    params;
  const dir = params.dir ?? JUST_BASH_WORKING_DIRECTORY;
  const fs = createFsClientFromIFileSystem(vfs);

  let currentBranch: string | undefined;

  const cloneToken = source?.token ?? githubToken;

  if (source) {
    const cloneUrl =
      cloneToken !== undefined
        ? (buildAuthenticatedGitHubUrl(source.repo, cloneToken) ?? source.repo)
        : source.repo;

    await git.clone({
      fs,
      http,
      dir,
      url: cloneUrl,
      ...(source.branch !== undefined ? { ref: source.branch } : {}),
      singleBranch: true,
    });

    if (source.newBranch !== undefined) {
      await git.branch({
        fs,
        dir,
        ref: source.newBranch,
        checkout: true,
      });
      currentBranch = source.newBranch;
    } else if (source.branch !== undefined) {
      currentBranch = source.branch;
    } else {
      const b = await git.currentBranch({ fs, dir });
      currentBranch = b ?? undefined;
    }
  } else if (!skipGitWorkspaceBootstrap) {
    await git.init({
      fs,
      dir,
      defaultBranch: "main",
    });

    if (gitUser) {
      await git.setConfig({
        fs,
        dir,
        path: "user.name",
        value: gitUser.name,
      });
      await git.setConfig({
        fs,
        dir,
        path: "user.email",
        value: gitUser.email,
      });

      const markerPath = `${dir}/${INIT_PLACEHOLDER}`;
      await vfs.writeFile(markerPath, "open-harness\n");
      await git.add({
        fs,
        dir,
        filepath: INIT_PLACEHOLDER,
      });
      await git.commit({
        fs,
        dir,
        message: "Initial commit",
        author: {
          name: gitUser.name,
          email: gitUser.email,
        },
      });
    }

    const b = await git.currentBranch({ fs, dir });
    currentBranch = b ?? "main";
  }

  return { currentBranch };
}
