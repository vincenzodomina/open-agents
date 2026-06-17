import {
  requireAuthenticatedUser,
  requireOwnedChatById,
} from "@/app/api/chat/_lib/chat-context";
import type { WebAgentUIMessage } from "@/app/types";
import {
  compareAndSetChatActiveStreamId,
  createChatMessageIfNotExists,
  updateChatAssistantActivity,
} from "@/lib/db/sessions";
import { getRuntimeClient } from "@/lib/runtime-connection/server-client";

type RouteContext = {
  params: Promise<{ chatId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const authResult = await requireAuthenticatedUser();
  if (!authResult.ok) {
    return authResult.response;
  }

  const { chatId } = await context.params;

  const chatContext = await requireOwnedChatById({
    userId: authResult.userId,
    chatId,
  });
  if (!chatContext.ok) {
    return chatContext.response;
  }

  const { chat } = chatContext;

  if (!chat.activeStreamId) {
    return Response.json({ success: true });
  }

  try {
    const body: unknown = await request.json().catch(() => null);
    if (isStopRequestWithMessage(body)) {
      await persistAssistantSnapshot(chatId, body.assistantMessage);
    }
  } catch {
    // Best-effort — don't block cancellation if persistence fails.
  }

  try {
    const runtime = getRuntimeClient();
    const response = await runtime.fetch(
      `/v1/chat/runs/${encodeURIComponent(chat.activeStreamId)}/stop`,
      { method: "POST" },
    );
    if (!response.ok) {
      throw new Error(`runtime returned ${response.status}`);
    }
  } catch (error) {
    console.error(
      `[workflow] Failed to cancel workflow run for chat ${chatId}:`,
      error,
    );
    return Response.json(
      { error: "Failed to cancel workflow run" },
      { status: 500 },
    );
  }

  await compareAndSetChatActiveStreamId(
    chatId,
    chat.activeStreamId,
    null,
  ).catch((err: unknown) => {
    console.error(
      `[workflow] Failed to clear activeStreamId for chat ${chatId}:`,
      err,
    );
  });

  return Response.json({ success: true });
}

async function persistAssistantSnapshot(
  chatId: string,
  message: WebAgentUIMessage,
): Promise<void> {
  const created = await createChatMessageIfNotExists({
    id: message.id,
    chatId,
    role: "assistant",
    parts: message,
  });
  if (created) {
    await updateChatAssistantActivity(chatId, new Date());
  }
}

function isStopRequestWithMessage(
  value: unknown,
): value is { assistantMessage: WebAgentUIMessage } {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  if (!("assistantMessage" in value) || !value.assistantMessage) {
    return false;
  }
  const msg = value.assistantMessage;
  return (
    typeof msg === "object" &&
    msg !== null &&
    "id" in msg &&
    typeof msg.id === "string" &&
    "role" in msg &&
    msg.role === "assistant" &&
    "parts" in msg &&
    Array.isArray(msg.parts)
  );
}
