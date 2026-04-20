import path from "node:path";

import type { IFileSystem } from "just-bash";

import { JUST_BASH_WORKING_DIRECTORY } from "./constants";

export function isAgentFsBackend(): boolean {
  return process.env["JUST_BASH_BACKEND"] === "agentfs";
}

export async function createAgentFsMount(
  workspacePath: string,
  sessionKey: string,
): Promise<IFileSystem> {
  const { agentfs } = await import("agentfs-sdk/just-bash");
  const dbPath = path.join(workspacePath, "agentfs.db");
  return agentfs({ id: sessionKey, path: dbPath }, JUST_BASH_WORKING_DIRECTORY);
}
