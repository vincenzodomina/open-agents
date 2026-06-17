import { verifyBotIdRequest } from "@/lib/botid-server";
import { forwardToRuntime } from "@/lib/runtime-connection/proxy-handler";
import { getServerSession } from "@/lib/session/get-server-session";

export async function POST(req: Request): Promise<Response> {
  const session = await getServerSession();
  if (!session?.user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const botVerification = await verifyBotIdRequest();
  if (botVerification.isBot) {
    return Response.json({ error: "Access denied" }, { status: 403 });
  }

  return forwardToRuntime(req, "/v1/transcribe");
}
