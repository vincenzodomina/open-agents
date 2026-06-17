import { createCancelableReadableStream } from "@open-harness/shared/lib/cancelable-readable-stream";
import type { WebAgentUIMessage } from "@open-harness/shared/lib/chat-types";
import { createUIMessageStreamResponse, type InferUIMessageChunk } from "ai";
import { getRun } from "workflow/api";
import type { AuthContext } from "../../auth.ts";

type WebAgentUIMessageChunk = InferUIMessageChunk<WebAgentUIMessage>;

export async function handleChatRunStream(
  _request: Request,
  _context: AuthContext,
  params: Record<string, string>,
): Promise<Response> {
  const id = params.id;
  if (!id) {
    return Response.json({ error: "missing run id" }, { status: 400 });
  }

  try {
    const run = getRun(id);
    const status = await run.status;

    if (
      status === "completed" ||
      status === "cancelled" ||
      status === "failed"
    ) {
      return new Response(null, { status: 204 });
    }

    const stream = createCancelableReadableStream(
      run.getReadable<WebAgentUIMessageChunk>(),
    );

    return createUIMessageStreamResponse({
      stream,
      headers: { "x-workflow-run-id": id },
    });
  } catch {
    return new Response(null, { status: 204 });
  }
}
