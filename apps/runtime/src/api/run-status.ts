import { getRun } from "workflow/api";
import type { AuthContext } from "../auth.ts";

export async function handleRunStatus(
  _request: Request,
  context: AuthContext,
  params: Record<string, string>,
): Promise<Response> {
  const id = params.id;
  if (!id) {
    return Response.json({ error: "missing run id" }, { status: 400 });
  }
  const run = getRun(id);
  const status = await run.status;
  return Response.json({ runId: id, status, requestedBy: context.user.id });
}
