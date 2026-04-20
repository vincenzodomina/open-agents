import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseServerUrl } from "./config";

let _admin: SupabaseClient | null = null;

/**
 * Server-only Supabase client with the service role key. Never import this
 * from client components or expose to the browser.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (_admin) {
    return _admin;
  }

  const url = getSupabaseServerUrl();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "SUPABASE_INTERNAL_URL or NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required",
    );
  }

  _admin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _admin;
}
