import type { LanguageModelUsage } from "ai";
import type { SandboxState } from "@open-harness/sandbox";
import type { WebAgentUIMessage } from "@/app/types";
import {
  compareAndSetChatActiveStreamId,
  createChatMessageIfNotExists,
  touchChat,
  updateChat,
  updateSession,
  isFirstChatMessage,
  upsertChatMessageScoped,
  updateChatAssistantActivity,
} from "@/lib/db/sessions";
import {
  buildActiveLifecycleUpdate,
  buildLifecycleActivityUpdate,
} from "@/lib/sandbox/lifecycle";
import { dedupeMessageReasoning } from "@/lib/chat/dedupe-message-reasoning";
import {
  recordWorkflowRun,
  type WorkflowRunStatus,
  type WorkflowRunStepTiming,
} from "@/lib/db/workflow-runs";

export async function persistUserMessage(
  chatId: string,
  message: WebAgentUIMessage,
): Promise<void> {
  "use step";

  if (message.role !== "user") {
    return;
  }

  try {
    const created = await createChatMessageIfNotExists({
      id: message.id,
      chatId,
      role: "user",
      parts: message,
    });

    if (!created) {
      return;
    }

    await touchChat(chatId);

    const shouldSetTitle = await isFirstChatMessage(chatId, created.id);
    if (!shouldSetTitle) {
      return;
    }

    const textContent = message.parts
      .filter(
        (part): part is { type: "text"; text: string } => part.type === "text",
      )
      .map((part) => part.text)
      .join(" ")
      .trim();

    if (textContent.length === 0) {
      return;
    }

    const title =
      textContent.length > 80 ? `${textContent.slice(0, 80)}...` : textContent;
    await updateChat(chatId, { title });
  } catch (error) {
    console.error("[workflow] Failed to persist user message:", error);
  }
}

export async function persistAssistantMessage(
  chatId: string,
  message: WebAgentUIMessage,
): Promise<void> {
  "use step";

  try {
    const dedupedMessage = dedupeMessageReasoning(message);
    const result = await upsertChatMessageScoped({
      id: dedupedMessage.id,
      chatId,
      role: "assistant",
      parts: dedupedMessage,
    });

    if (result.status === "conflict") {
      console.warn(
        `[workflow] Skipped assistant upsert due to ID scope conflict: ${message.id}`,
      );
    } else if (result.status === "inserted") {
      await updateChatAssistantActivity(chatId, new Date());
    }
  } catch (error) {
    console.error("[workflow] Failed to persist assistant message:", error);
  }
}

export async function refreshLifecycleActivity(
  sessionId: string,
): Promise<void> {
  "use step";

  try {
    await updateSession(sessionId, buildLifecycleActivityUpdate(new Date()));
  } catch (error) {
    console.error("[workflow] Failed to refresh lifecycle activity:", error);
  }
}

export async function persistSandboxState(
  sessionId: string,
  sandboxState: SandboxState,
): Promise<void> {
  "use step";
  try {
    const { connectSandbox } = await import("@open-harness/sandbox");
    const sandbox = await connectSandbox(sandboxState);
    const currentState = sandbox.getState?.() as SandboxState | undefined;
    if (currentState) {
      await updateSession(sessionId, {
        sandboxState: currentState,
        ...buildActiveLifecycleUpdate(currentState, {
          activityAt: new Date(),
        }),
      });
    }
  } catch (error) {
    console.error("[workflow] Failed to persist sandbox state:", error);
  }
}

const ACTIVE_STREAM_CLEAR_MAX_ATTEMPTS = 3;
const ACTIVE_STREAM_CLEAR_RETRY_DELAY_MS = 50;

export async function clearActiveStream(
  chatId: string,
  workflowRunId: string,
): Promise<void> {
  "use step";

  for (
    let attempt = 1;
    attempt <= ACTIVE_STREAM_CLEAR_MAX_ATTEMPTS;
    attempt++
  ) {
    try {
      // Only clear if this workflow's run ID is still the active one.
      // Prevents a late-finishing workflow from clearing a newer workflow's ID.
      await compareAndSetChatActiveStreamId(chatId, workflowRunId, null);
      return;
    } catch (error) {
      if (attempt === ACTIVE_STREAM_CLEAR_MAX_ATTEMPTS) {
        console.error("[workflow] Failed to clear activeStreamId:", error);
        return;
      }

      await delay(ACTIVE_STREAM_CLEAR_RETRY_DELAY_MS);
    }
  }
}

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function recordWorkflowUsage(
  userId: string,
  modelId: string,
  totalUsage: LanguageModelUsage | undefined,
  responseMessage: WebAgentUIMessage,
  previousResponseMessage?: WebAgentUIMessage,
  workflowRun?: {
    workflowRunId: string;
    chatId: string;
    sessionId: string;
    status: WorkflowRunStatus;
    startedAt: string;
    finishedAt: string;
    totalDurationMs: number;
    stepTimings: WorkflowRunStepTiming[];
  },
): Promise<void> {
  "use step";

  try {
    void totalUsage;
    void responseMessage;
    void previousResponseMessage;

    if (workflowRun) {
      try {
        await recordWorkflowRun({
          id: workflowRun.workflowRunId,
          chatId: workflowRun.chatId,
          sessionId: workflowRun.sessionId,
          userId,
          modelId,
          status: workflowRun.status,
          startedAt: workflowRun.startedAt,
          finishedAt: workflowRun.finishedAt,
          totalDurationMs: workflowRun.totalDurationMs,
          stepTimings: workflowRun.stepTimings,
        });
      } catch (error) {
        console.error("[workflow] Failed to record workflow run:", error);
      }
    }
  } catch (error) {
    console.error("[workflow] Failed to record workflow metadata:", error);
  }
}
