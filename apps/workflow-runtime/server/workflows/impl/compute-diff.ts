import type { Sandbox } from "@open-harness/sandbox";
import { computeAndCacheDiff as sharedCompute } from "@open-harness/shared/lib/diff/compute-diff";
import { updateSession } from "./db-sessions";

export async function computeAndCacheDiff(params: {
  sandbox: Sandbox;
  sessionId: string;
}): Promise<void> {
  await sharedCompute({
    sandbox: params.sandbox,
    sessionId: params.sessionId,
    updateSession,
  });
}
