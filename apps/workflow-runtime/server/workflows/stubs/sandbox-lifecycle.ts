import type { SandboxState } from "@open-harness/sandbox";

const SANDBOX_INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;

type LifecycleState = "active" | "restoring" | "hibernated";

type LifecycleUpdate = {
  lifecycleState: LifecycleState;
  lifecycleError: null;
  lastActivityAt: Date;
  hibernateAfter: Date;
  sandboxExpiresAt?: Date | null;
};

function getSandboxExpiresAtDate(
  sandboxState: SandboxState | null | undefined,
): Date | null {
  if (!sandboxState || !("expiresAt" in sandboxState)) {
    return null;
  }
  return typeof sandboxState.expiresAt === "number"
    ? new Date(sandboxState.expiresAt)
    : null;
}

export function buildLifecycleActivityUpdate(
  activityAt: Date = new Date(),
  lifecycleState: Extract<LifecycleState, "active" | "restoring"> = "active",
): Omit<LifecycleUpdate, "sandboxExpiresAt"> {
  return {
    lifecycleState,
    lifecycleError: null,
    lastActivityAt: activityAt,
    hibernateAfter: new Date(
      activityAt.getTime() + SANDBOX_INACTIVITY_TIMEOUT_MS,
    ),
  };
}

export function buildActiveLifecycleUpdate(
  sandboxState: SandboxState | null | undefined,
  options?: {
    activityAt?: Date;
    lifecycleState?: Extract<LifecycleState, "active" | "restoring">;
  },
): LifecycleUpdate {
  const activityAt = options?.activityAt ?? new Date();
  return {
    ...buildLifecycleActivityUpdate(
      activityAt,
      options?.lifecycleState ?? "active",
    ),
    sandboxExpiresAt: getSandboxExpiresAtDate(sandboxState),
  };
}
