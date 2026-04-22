import type { Sandbox, SandboxHooks } from "../interface";
import type { VercelState } from "../vercel/state";
import {
  getActiveJustBashSandbox,
  setDormantWorkspaceRoot,
  takeDormantWorkspaceRoot,
} from "./registry";
import { JustBashSandbox } from "./sandbox";

interface ConnectOptions {
  env?: Record<string, string>;
  hooks?: SandboxHooks;
  timeout?: number;
  ports?: number[];
  baseSnapshotId?: string;
  resume?: boolean;
  createIfMissing?: boolean;
  persistent?: boolean;
  snapshotExpiration?: number;
}

function getSandboxName(state: VercelState): string | undefined {
  if (typeof state.sandboxName === "string" && state.sandboxName.length > 0) {
    return state.sandboxName;
  }

  if (typeof state.sandboxId === "string" && state.sandboxId.length > 0) {
    return state.sandboxId;
  }

  return undefined;
}

function buildJustBashCreateConfig(
  state: VercelState,
  options?: ConnectOptions,
) {
  const sandboxName = getSandboxName(state);

  return {
    ...(sandboxName ? { name: sandboxName } : {}),
    env: options?.env,
    hooks: options?.hooks,
    ...(options?.timeout !== undefined && { timeout: options.timeout }),
    ...(options?.ports && { ports: options.ports }),
    ...(options?.baseSnapshotId && {
      baseSnapshotId: options.baseSnapshotId,
    }),
    ...(state.snapshotId ? { restoreSnapshotId: state.snapshotId } : {}),
  };
}

/**
 * Local in-process sandbox (just-bash). Mirrors {@link ../vercel/connect.connectVercel} entry points
 * without calling `@vercel/sandbox`.
 */
export async function connectJustBash(
  state: VercelState,
  options?: ConnectOptions,
): Promise<Sandbox> {
  const sandboxName = getSandboxName(state);

  if (sandboxName) {
    const existing = getActiveJustBashSandbox(sandboxName);
    if (existing !== undefined) {
      return existing;
    }

    const dormantPathPeek = takeDormantWorkspaceRoot(sandboxName);
    if (dormantPathPeek !== undefined) {
      try {
        return await JustBashSandbox.reopen({
          name: sandboxName,
          rootPath: dormantPathPeek,
          env: options?.env,
          hooks: options?.hooks,
          timeout: options?.timeout,
          ports: options?.ports ?? [],
        });
      } catch (error) {
        setDormantWorkspaceRoot(sandboxName, dormantPathPeek);
        throw error;
      }
    }

    if (options?.createIfMissing === false) {
      throw new Error(
        `just-bash: sandbox '${sandboxName}' is not available (no dormant workspace and createIfMissing is false)`,
      );
    }

    return JustBashSandbox.create(buildJustBashCreateConfig(state, options));
  }

  return JustBashSandbox.create(buildJustBashCreateConfig(state, options));
}
