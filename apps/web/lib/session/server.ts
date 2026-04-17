import type { NextRequest } from "next/server";
import type { Session } from "./types";
import { getSessionFromJweCookie } from "./jwe-cookie";
import { resolveAppSession } from "./resolve-app-session";

export async function getSessionFromCookie(
  cookieValue?: string,
): Promise<Session | undefined> {
  return getSessionFromJweCookie(cookieValue);
}

export async function getSessionFromReq(
  _req: NextRequest,
): Promise<Session | undefined> {
  return resolveAppSession();
}
