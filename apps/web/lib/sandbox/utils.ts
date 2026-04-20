import type { SandboxState } from "@open-harness/sandbox";
import { SANDBOX_EXPIRES_BUFFER_MS } from "./config";

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

function getLegacySandboxId(state: unknown): string | null {
  if (!state || typeof state !== "object") {
    return null;
  }

  const sandboxId = (state as { sandboxId?: unknown }).sandboxId;
  return hasNonEmptyString(sandboxId) ? sandboxId : null;
}

export function getSessionSandboxName(sessionId: string): string {
  return `session_${sessionId}`;
}

export function getPersistentSandboxName(state: unknown): string | null {
  if (!state || typeof state !== "object") {
    return null;
  }

  const sandboxName = (state as { sandboxName?: unknown }).sandboxName;
  return hasNonEmptyString(sandboxName) ? sandboxName : null;
}

export function getResumableSandboxName(state: unknown): string | null {
  return getPersistentSandboxName(state) ?? getLegacySandboxId(state);
}

export function hasResumableSandboxState(state: unknown): boolean {
  return getResumableSandboxName(state) !== null;
}

export function hasPausedSandboxState(state: unknown): boolean {
  return hasResumableSandboxState(state) && !hasRuntimeSandboxState(state);
}

/**
 * Type guard to check if a sandbox is active and ready to accept operations.
 */
export function isSandboxActive(
  state: SandboxState | null | undefined,
): state is SandboxState {
  if (!state) return false;

  const expiresAt = getSandboxExpiresAt(state);
  if (expiresAt === undefined) {
    return false;
  }

  if (Date.now() >= expiresAt - SANDBOX_EXPIRES_BUFFER_MS) {
    return false;
  }

  return hasRuntimeState(state);
}

/**
 * Check if we can perform operations on a live sandbox session (stop, extend, etc.).
 */
export function canOperateOnSandbox(
  state: SandboxState | null | undefined,
): state is SandboxState {
  if (!state) return false;
  return hasRuntimeState(state);
}

/**
 * Check if an unknown value represents sandbox state with live runtime data.
 */
export function hasRuntimeSandboxState(state: unknown): boolean {
  if (!state || typeof state !== "object") return false;

  const expiresAt = getSandboxExpiresAt(state);
  if (expiresAt === undefined) {
    return false;
  }

  return hasResumableSandboxState(state);
}

/**
 * Session-row aware runtime check for API routes.
 *
 * `sandbox_state` JSON normally includes `expiresAt`, but some writes only
 * persist `sandbox_expires_at` on the session row (or the blob can drift).
 * Treat just-bash + resumable handle + non-expired `sandboxExpiresAt` as live
 * so {@link hasRuntimeSandboxState} alone does not flip the UI to "no sandbox".
 */
export function hasEffectiveRuntimeSandboxState(session: {
  sandboxState: unknown;
  sandboxExpiresAt: Date | null;
}): boolean {
  if (hasRuntimeSandboxState(session.sandboxState)) {
    return true;
  }

  const state = session.sandboxState;
  if (!state || typeof state !== "object") {
    return false;
  }

  const type = (state as { type?: unknown }).type;
  if (type !== "just-bash") {
    return false;
  }

  if (!hasResumableSandboxState(state)) {
    return false;
  }

  const col = session.sandboxExpiresAt;
  if (!col) {
    return false;
  }

  return Date.now() < col.getTime() - SANDBOX_EXPIRES_BUFFER_MS;
}

/**
 * Whether API routes may connect to the sandbox — aligned with reconnect/status:
 * {@link hasEffectiveRuntimeSandboxState}, without letting a stale
 * `sandbox_expires_at` column veto JSON-backed runtime state (`expiresAt` on
 * `sandbox_state`).
 */
export function isSessionSandboxOperational(sessionRecord: {
  sandboxState: unknown;
  sandboxExpiresAt: Date | null;
}): boolean {
  if (!hasEffectiveRuntimeSandboxState(sessionRecord)) {
    return false;
  }

  const state = sessionRecord.sandboxState;
  const jsonExpiresAt =
    state && typeof state === "object"
      ? (state as { expiresAt?: unknown }).expiresAt
      : undefined;

  if (typeof jsonExpiresAt === "number") {
    return true;
  }

  if (!sessionRecord.sandboxExpiresAt) {
    return true;
  }
  return (
    Date.now() <
    sessionRecord.sandboxExpiresAt.getTime() - SANDBOX_EXPIRES_BUFFER_MS
  );
}

export function isSandboxNotFoundError(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("status code 404") ||
    normalized.includes("sandbox not found")
  );
}

/**
 * Check if an error message indicates the sandbox VM is permanently unavailable.
 */
export function isSandboxUnavailableError(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("expected a stream of command data") ||
    normalized.includes("status code 410") ||
    normalized.includes("status code 404") ||
    normalized.includes("sandbox is stopped") ||
    normalized.includes("sandbox not found") ||
    normalized.includes("sandbox probe failed")
  );
}

function hasRuntimeState(state: SandboxState): boolean {
  const expiresAt = getSandboxExpiresAt(state);
  if (expiresAt === undefined) {
    return false;
  }

  return hasResumableSandboxState(state);
}

/**
 * Clear sandbox runtime state while preserving durable resume state when available.
 */
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

/**
 * Clear both runtime state and any saved resume handle.
 */
export function clearSandboxResumeState(
  state: SandboxState | null | undefined,
): SandboxState | null {
  if (!state) return null;

  return { type: state.type } as SandboxState;
}

/**
 * Clear sandbox state after an unavailable-sandbox error.
 * Hard 404s wipe the saved resume handle; other unavailable errors preserve it.
 */
export function clearUnavailableSandboxState(
  state: SandboxState | null | undefined,
  message: string,
): SandboxState | null {
  return isSandboxNotFoundError(message)
    ? clearSandboxResumeState(state)
    : clearSandboxState(state);
}
