import { nanoid } from "nanoid";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export type WorkflowRunStatus = "completed" | "aborted" | "failed";

export type WorkflowRunStepTiming = {
  stepNumber: number;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  finishReason?: string;
  rawFinishReason?: string;
};

export async function recordWorkflowRun(data: {
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
}) {
  const p_run = {
    id: data.id,
    chat_id: data.chatId,
    session_id: data.sessionId,
    user_id: data.userId,
    model_id: data.modelId ?? null,
    status: data.status,
    started_at: data.startedAt,
    finished_at: data.finishedAt,
    total_duration_ms: data.totalDurationMs,
  };

  const p_steps = data.stepTimings.map((stepTiming) => ({
    id: nanoid(),
    step_number: stepTiming.stepNumber,
    started_at: stepTiming.startedAt,
    finished_at: stepTiming.finishedAt,
    duration_ms: stepTiming.durationMs,
    finish_reason: stepTiming.finishReason ?? null,
    raw_finish_reason: stepTiming.rawFinishReason ?? null,
  }));

  const { error } = await getSupabaseAdmin().rpc("record_workflow_run", {
    p_run: p_run as object,
    p_steps: p_steps.length > 0 ? (p_steps as object) : null,
  });

  if (error) {
    throw error;
  }
}
