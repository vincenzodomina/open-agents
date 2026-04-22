import type { NextRequest } from "next/server";
import { userExists } from "@/lib/db/users";
import { getSessionFromReq } from "@/lib/session/server";
import type { SessionUserInfo } from "@/lib/session/types";

const UNAUTHENTICATED: SessionUserInfo = { user: undefined };

export async function GET(req: NextRequest) {
  const session = await getSessionFromReq(req);

  if (!session?.user?.id) {
    return Response.json(UNAUTHENTICATED);
  }

  const exists = await userExists(session.user.id);

  if (!exists) {
    return Response.json(UNAUTHENTICATED);
  }

  const data: SessionUserInfo = {
    user: session.user,
    authProvider: session.authProvider,
  };

  return Response.json(data);
}
