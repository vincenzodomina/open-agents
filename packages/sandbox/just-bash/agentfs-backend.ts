import path from "node:path";

import type { IFileSystem } from "just-bash";
import { agentfs } from "agentfs-sdk/just-bash";

import { JUST_BASH_WORKING_DIRECTORY } from "./constants";

/**
 * When set to `agentfs`, the just-bash workspace uses [AgentFS](https://docs.turso.tech/agentfs/introduction)
 * (SQLite-backed) via `agentfs-sdk/just-bash` instead of {@link ReadWriteFs} on local disk.
 *
 * The database file lives at `{workspacePath}/agentfs.db` (alongside the session workspace dir).
 */
export function isAgentFsBackend(): boolean {
  return process.env["JUST_BASH_BACKEND"] === "agentfs";
}

/**
 * Builds an {@link IFileSystem} rooted at {@link JUST_BASH_WORKING_DIRECTORY} so paths match the
 * existing Open Harness / Vercel sandbox layout (`/vercel/sandbox/...`).
 */
export async function createAgentFsMount(
  workspacePath: string,
  sessionKey: string,
): Promise<IFileSystem> {
  const dbPath = path.join(workspacePath, "agentfs.db");
  return agentfs({ id: sessionKey, path: dbPath }, JUST_BASH_WORKING_DIRECTORY);
}
