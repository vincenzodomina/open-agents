import { verifyBotIdRequest } from "@/lib/botid-server";
import { getSessionById } from "@/lib/db/sessions";
import { getRuntimeClient } from "@/lib/runtime-connection/server-client";
import { isSessionSandboxOperational } from "@/lib/sandbox/utils";
import { getServerSession } from "@/lib/session/get-server-session";

export const maxDuration = 30;

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ sessionId: string }> },
): Promise<Response> {
  const session = await getServerSession();
  if (!session?.user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const botVerification = await verifyBotIdRequest();
  if (botVerification.isBot) {
    return Response.json({ error: "Access denied" }, { status: 403 });
  }

  const { sessionId } = await params;
  const dbSession = await getSessionById(sessionId);
  if (!dbSession || dbSession.userId !== session.user.id) {
    return Response.json({ error: "Session not found" }, { status: 404 });
  }

  if (!isSessionSandboxOperational(dbSession) || !dbSession.sandboxState) {
    return Response.json({ error: "No active sandbox" }, { status: 400 });
  }

  const runtime = getRuntimeClient();
  return runtime.fetch("/v1/generate-commit-message", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      sandboxState: dbSession.sandboxState,
      sessionTitle: dbSession.title,
    }),
  });
}
