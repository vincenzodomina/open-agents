import { createCancelableReadableStream } from "@open-harness/shared/lib/cancelable-readable-stream";
import type { WebAgentUIMessage } from "@open-harness/shared/lib/chat-types";
import { createUIMessageStreamResponse, type InferUIMessageChunk } from "ai";
import { defineEventHandler, getRouterParam } from "nitro/h3";
import { getRun } from "workflow/api";
import { requireAuth } from "../../../../utils/auth";

type WebAgentUIMessageChunk = InferUIMessageChunk<WebAgentUIMessage>;

export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event);
  if (auth instanceof Response) {
    return auth;
  }

  const id = getRouterParam(event, "id");
  if (!id) {
    return new Response(JSON.stringify({ error: "missing run id" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
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

    return createUIMessageStreamResponse({ stream });
  } catch {
    return new Response(null, { status: 204 });
  }
});
