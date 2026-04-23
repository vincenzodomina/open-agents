import type { WebAgentUIMessage } from "@open-harness/shared/lib/chat-types";
import { createCancelableReadableStream } from "@open-harness/shared/lib/cancelable-readable-stream";
import { createUIMessageStreamResponse, type InferUIMessageChunk } from "ai";
import { start } from "workflow/api";
import type { AuthContext } from "../../auth.ts";
import { runAgentWorkflow } from "../../workflow-stubs.ts";
import type { runAgentWorkflow as RunAgentWorkflow } from "../../workflows/chat.ts";

type WebAgentUIMessageChunk = InferUIMessageChunk<WebAgentUIMessage>;

type ChatStartBody = Parameters<typeof RunAgentWorkflow>[0];

export async function handleChatStart(
  request: Request,
  context: AuthContext,
): Promise<Response> {
  const body = (await request.json().catch(() => null)) as ChatStartBody | null;
  if (!body || typeof body !== "object") {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }
  if (body.userId && body.userId !== context.user.id) {
    return Response.json({ error: "userId mismatch" }, { status: 403 });
  }

  const run = await start(runAgentWorkflow, [
    { ...body, userId: context.user.id },
  ]);

  const stream = createCancelableReadableStream(
    run.getReadable<WebAgentUIMessageChunk>(),
  );

  return createUIMessageStreamResponse({
    stream,
    headers: { "x-workflow-run-id": run.runId },
  });
}
