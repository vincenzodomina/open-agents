import { defineEventHandler, getRouterParam } from "nitro/h3";
import { getRun } from "workflow/api";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) {
    return { error: "missing run id" };
  }
  const run = getRun(id);
  const status = await run.status;
  return { runId: id, status };
});
