import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { syncAppUserFromSupabase } from "@/lib/supabase/sync-app-user";
import { SESSION_COOKIE_NAME } from "./constants";
import { getSessionFromJweCookie } from "./jwe-cookie";
import type { Session } from "./types";

export async function resolveAppSession(): Promise<Session | undefined> {
  const hasSupabase =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (hasSupabase) {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.user) {
      return syncAppUserFromSupabase(session);
    }
  }

  const store = await cookies();
  const cookieValue = store.get(SESSION_COOKIE_NAME)?.value;
  return getSessionFromJweCookie(cookieValue);
}
