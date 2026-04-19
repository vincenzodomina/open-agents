import { mkdir, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

export { JUST_BASH_WORKING_DIRECTORY } from "./constants";

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
