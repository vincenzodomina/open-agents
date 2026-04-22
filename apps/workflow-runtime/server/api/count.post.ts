import { defineEventHandler, readBody } from "nitro/h3";
import { start } from "workflow/api";
import { requireAuth } from "../utils/auth";
import { countToN } from "../workflows/counter";

export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event);
  if (auth instanceof Response) {
    return auth;
  }
  const body = (await readBody(event)) as { target?: number };
  const target = typeof body?.target === "number" ? body.target : 3;
  const run = await start(countToN, [target]);
  return {
    runId: run.runId,
    target,
    startedBy: auth.userId,
  };
});
