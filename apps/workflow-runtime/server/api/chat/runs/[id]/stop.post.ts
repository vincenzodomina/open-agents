import { defineEventHandler, getRouterParam } from "nitro/h3";
import { getRun } from "workflow/api";
import { requireAuth } from "../../../../utils/auth";

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
    await getRun(id).cancel();
  } catch (err) {
    console.error("[workflow-runtime] cancel failed", err);
  }
  return { runId: id, cancelled: true, requestedBy: auth.userId };
});
