import { getRun } from "workflow/api";
import type { AuthContext } from "../../auth.ts";

export async function handleChatRunStop(
  _request: Request,
  context: AuthContext,
  params: Record<string, string>,
): Promise<Response> {
  const id = params.id;
  if (!id) {
    return Response.json({ error: "missing run id" }, { status: 400 });
  }
  try {
    await getRun(id).cancel();
  } catch (err) {
    console.error("[runtime] cancel failed", err);
  }
  return Response.json({
    runId: id,
    cancelled: true,
    requestedBy: context.user.id,
  });
}
