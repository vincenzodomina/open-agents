import { createClient } from "@/lib/supabase/server";
import { syncAppUserFromSupabase } from "@/lib/supabase/sync-app-user";
import type { Session } from "./types";

export async function resolveAppSession(): Promise<Session | undefined> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return undefined;
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return undefined;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) {
    return undefined;
  }

  return syncAppUserFromSupabase(session);
}
