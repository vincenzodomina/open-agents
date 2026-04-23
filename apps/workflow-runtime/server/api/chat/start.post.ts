import { defineEventHandler, readBody } from "nitro/h3";
import { start } from "workflow/api";
import { requireAuth } from "../../utils/auth";
import { runAgentWorkflow } from "../../workflows/chat";

/**
 * Starts a chat workflow run. Body mirrors the `Options` shape of
 * runAgentWorkflow in server/workflows/chat.ts; returns `{ runId }`.
 * The web app then streams the run via GET /api/chat/runs/:id/stream
 * (Phase 3c-2) or simply polls status.
 */
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
  return { runId: run.runId };
});
