import "server-only";

import { getRuntimeClient } from "@/lib/runtime-connection/server-client";
import type { SandboxLifecycleReason } from "./lifecycle";

interface KickSandboxLifecycleInput {
  sessionId: string;
  reason: SandboxLifecycleReason;
  scheduleBackgroundWork?: (callback: () => Promise<void>) => void;
}

export function kickSandboxLifecycleWorkflow(input: KickSandboxLifecycleInput) {
  const run = async () => {
    try {
      const runtime = getRuntimeClient();
      const response = await runtime.fetch("/v1/sandbox/lifecycle/kick", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sessionId: input.sessionId,
          reason: input.reason,
        }),
      });
      if (!response.ok) {
        console.error(
          `[Lifecycle] runtime returned ${response.status} for session ${input.sessionId}`,
        );
      }
    } catch (error) {
      console.error(
        `[Lifecycle] Failed to kick runtime for session ${input.sessionId}:`,
        error,
      );
    }
  };

  if (input.scheduleBackgroundWork) {
    input.scheduleBackgroundWork(run);
    return;
  }
  void run();
}
