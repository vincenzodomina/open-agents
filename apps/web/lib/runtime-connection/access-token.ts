import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function getSupabaseAccessToken(): Promise<string | undefined> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token;
}
