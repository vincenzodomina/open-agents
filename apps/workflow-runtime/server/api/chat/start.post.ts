import { createCancelableReadableStream } from "@open-harness/shared/lib/cancelable-readable-stream";
import type { WebAgentUIMessage } from "@open-harness/shared/lib/chat-types";
import { createUIMessageStreamResponse, type InferUIMessageChunk } from "ai";
import { defineEventHandler, readBody } from "nitro/h3";
import { start } from "workflow/api";
import { requireAuth } from "../../utils/auth";
import { runAgentWorkflow } from "../../workflows/chat";

type WebAgentUIMessageChunk = InferUIMessageChunk<WebAgentUIMessage>;

export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event);
  if (auth instanceof Response) {
    return auth;
  }

  const body = (await readBody(event)) as Parameters<
    typeof runAgentWorkflow
  >[0];
  if (!body || typeof body !== "object") {
    return new Response(JSON.stringify({ error: "Invalid body" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }
  if (body.userId && body.userId !== auth.userId) {
    return new Response(JSON.stringify({ error: "userId mismatch" }), {
      status: 403,
      headers: { "content-type": "application/json" },
    });
  }

  const run = await start(runAgentWorkflow, [{ ...body, userId: auth.userId }]);

  const stream = createCancelableReadableStream(
    run.getReadable<WebAgentUIMessageChunk>(),
  );

  return createUIMessageStreamResponse({
    stream,
    headers: {
      "x-workflow-run-id": run.runId,
    },
  });
});
