// Phase 3c-1 stub. See ./README.md.
import type { SandboxState } from "@open-harness/sandbox";

type LifecycleUpdate = Record<string, unknown>;

export function buildLifecycleActivityUpdate(
  activityAt: Date = new Date(),
  lifecycleState: "active" | "restoring" = "active",
): LifecycleUpdate {
  return {
    lifecycleState,
    lifecycleError: null,
    lastActivityAt: activityAt,
  };
}

export function buildActiveLifecycleUpdate(
  _sandboxState: SandboxState | null | undefined,
  options?: {
    activityAt?: Date;
    lifecycleState?: "active" | "restoring";
  },
): LifecycleUpdate {
  const activityAt = options?.activityAt ?? new Date();
  return {
    ...buildLifecycleActivityUpdate(
      activityAt,
      options?.lifecycleState ?? "active",
    ),
  };
}
