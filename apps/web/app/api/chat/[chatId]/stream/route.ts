import {
  requireAuthenticatedUser,
  requireOwnedChatById,
} from "@/app/api/chat/_lib/chat-context";
import { updateChatActiveStreamId } from "@/lib/db/sessions";
import { getRuntimeClient } from "@/lib/runtime-connection/server-client";

type RouteContext = {
  params: Promise<{ chatId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const authResult = await requireAuthenticatedUser("text");
  if (!authResult.ok) {
    return authResult.response;
  }

  const { chatId } = await context.params;

  const chatContext = await requireOwnedChatById({
    userId: authResult.userId,
    chatId,
    format: "text",
  });
  if (!chatContext.ok) {
    return chatContext.response;
  }

  const { chat } = chatContext;

  if (!chat.activeStreamId) {
    return new Response(null, { status: 204 });
  }

  const runId = chat.activeStreamId;
  const runtime = getRuntimeClient();

  try {
    const response = await runtime.fetch(
      `/v1/chat/runs/${encodeURIComponent(runId)}/stream`,
      { method: "GET" },
    );

    if (response.status === 204) {
      await updateChatActiveStreamId(chatId, null);
      return new Response(null, { status: 204 });
    }

    return new Response(response.body, {
      status: response.status,
      headers: response.headers,
    });
  } catch {
    await updateChatActiveStreamId(chatId, null);
    return new Response(null, { status: 204 });
  }
}
