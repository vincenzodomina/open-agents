// Phase 3c-1 stub. See ./README.md.
import type {
  WorkflowRunStatus,
  WorkflowRunStepTiming,
} from "@open-harness/shared/lib/workflow-run-types";

export type { WorkflowRunStatus, WorkflowRunStepTiming };

export async function recordWorkflowRun(_data: {
  id: string;
  chatId: string;
  sessionId: string;
  userId: string;
  modelId?: string;
  status: WorkflowRunStatus;
  startedAt: string;
  finishedAt: string;
  totalDurationMs: number;
  stepTimings: WorkflowRunStepTiming[];
}): Promise<void> {
  console.warn("[workflow-runtime/stub] recordWorkflowRun()");
}
