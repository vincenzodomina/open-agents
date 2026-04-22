import { defineEventHandler, getRouterParam } from "nitro/h3";
import { getRun } from "workflow/api";
import { requireAuth } from "../../utils/auth";

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
  const run = getRun(id);
  const status = await run.status;
  return { runId: id, status, requestedBy: auth.userId };
});
