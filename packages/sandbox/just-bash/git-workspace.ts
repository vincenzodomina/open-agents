import git from "isomorphic-git";
import http from "isomorphic-git/http/node";
import type { AuthCallback } from "isomorphic-git";

import type { IFileSystem } from "just-bash";

import type { Source } from "../types";
import { JUST_BASH_WORKING_DIRECTORY } from "./constants";
import { createFsClientFromIFileSystem } from "./isomorphic-git-fs";
import { publicGitHubHttpsUrl, scrubHttpsCredentials } from "./git-url";

export interface BootstrapGitWorkspaceParams {
  vfs: IFileSystem;
  dir?: string;
  source?: Source;
  gitUser?: { name: string; email: string };
  githubToken?: string;
  skipGitWorkspaceBootstrap?: boolean;
}

const INIT_PLACEHOLDER = ".open-harness-git-placeholder";

async function scrubOriginRemoteIfNeeded(
  fs: ReturnType<typeof createFsClientFromIFileSystem>,
  dir: string,
): Promise<void> {
  const raw = await git.getConfig({
    fs,
    dir,
    path: "remote.origin.url",
  });
  if (typeof raw !== "string") {
    return;
  }
  const scrubbed = scrubHttpsCredentials(raw);
  if (scrubbed !== undefined && scrubbed !== raw) {
    await git.setConfig({
      fs,
      dir,
      path: "remote.origin.url",
      value: scrubbed,
    });
  }
}

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
    let cloneUrl = source.repo;
    let onAuth: AuthCallback | undefined;
    if (cloneToken !== undefined) {
      cloneUrl =
        scrubHttpsCredentials(source.repo) ??
        publicGitHubHttpsUrl(source.repo) ??
        source.repo;
      onAuth = () => ({
        username: cloneToken,
        password: "",
      });
    }

    await git.clone({
      fs,
      http,
      dir,
      url: cloneUrl,
      ...(source.branch !== undefined ? { ref: source.branch } : {}),
      singleBranch: true,
      ...(onAuth !== undefined ? { onAuth } : {}),
    });

    await scrubOriginRemoteIfNeeded(fs, dir);

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
