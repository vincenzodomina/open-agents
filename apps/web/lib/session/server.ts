import type { NextRequest } from "next/server";
import type { Session } from "./types";
import { resolveAppSession } from "./resolve-app-session";

export async function getSessionFromReq(
  _req: NextRequest,
): Promise<Session | undefined> {
  return resolveAppSession();
}
