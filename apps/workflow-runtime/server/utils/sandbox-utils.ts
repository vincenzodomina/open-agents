import type { SandboxState } from "@open-harness/sandbox";

const SANDBOX_EXPIRES_BUFFER_MS = 10 * 1000;

function hasNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function getSandboxExpiresAt(state: unknown): number | undefined {
  if (!state || typeof state !== "object") {
    return undefined;
  }
  const expiresAt = (state as { expiresAt?: unknown }).expiresAt;
  return typeof expiresAt === "number" ? expiresAt : undefined;
}

function hasActiveJustBashRuntimeState(state: unknown): boolean {
  if (!state || typeof state !== "object") {
    return false;
  }
  if ((state as { type?: unknown }).type !== "just-bash") {
    return false;
  }
  return (
    (state as { runtimeState?: unknown }).runtimeState === "active" &&
    hasResumableSandboxState(state)
  );
}

function getLegacySandboxId(state: unknown): string | null {
  if (!state || typeof state !== "object") {
    return null;
  }
  const sandboxId = (state as { sandboxId?: unknown }).sandboxId;
  return hasNonEmptyString(sandboxId) ? sandboxId : null;
}

export function getPersistentSandboxName(state: unknown): string | null {
  if (!state || typeof state !== "object") {
    return null;
  }
  const sandboxName = (state as { sandboxName?: unknown }).sandboxName;
  return hasNonEmptyString(sandboxName) ? sandboxName : null;
}

function getResumableSandboxName(state: unknown): string | null {
  return getPersistentSandboxName(state) ?? getLegacySandboxId(state);
}

function hasResumableSandboxState(state: unknown): boolean {
  return getResumableSandboxName(state) !== null;
}

function hasRuntimeState(state: SandboxState): boolean {
  if (hasActiveJustBashRuntimeState(state)) {
    return true;
  }
  const expiresAt = getSandboxExpiresAt(state);
  if (expiresAt === undefined) {
    return false;
  }
  return hasResumableSandboxState(state);
}

export function canOperateOnSandbox(
  state: SandboxState | null | undefined,
): state is SandboxState {
  if (!state) return false;
  return hasRuntimeState(state);
}

export function clearSandboxState(
  state: SandboxState | null | undefined,
): SandboxState | null {
  if (!state) return null;

  const sandboxName = getPersistentSandboxName(state);
  const sandboxId = sandboxName ? null : getLegacySandboxId(state);

  return {
    type: state.type,
    ...(sandboxName ? { sandboxName } : {}),
    ...(sandboxId ? { sandboxId } : {}),
  } as SandboxState;
}

export { SANDBOX_EXPIRES_BUFFER_MS };
