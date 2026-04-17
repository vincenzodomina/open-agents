import type { Session } from "./types";
import { decryptJWE } from "@/lib/jwe/decrypt";

export async function getSessionFromJweCookie(
  cookieValue?: string,
): Promise<Session | undefined> {
  if (!cookieValue) {
    return undefined;
  }
  const decrypted = await decryptJWE<Session>(cookieValue);
  if (!decrypted) {
    return undefined;
  }
  return {
    created: decrypted.created,
    authProvider: decrypted.authProvider,
    user: decrypted.user,
  };
}
