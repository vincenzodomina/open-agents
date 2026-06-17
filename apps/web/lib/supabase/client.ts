import { createBrowserClient } from "@supabase/ssr";
import {
  getSupabaseAnonKey,
  getSupabaseAuthStorageKey,
  getSupabaseBrowserUrl,
} from "./config";

export function createClient() {
  return createBrowserClient(getSupabaseBrowserUrl()!, getSupabaseAnonKey()!, {
    cookieOptions: {
      name: getSupabaseAuthStorageKey(),
    },
  });
}
