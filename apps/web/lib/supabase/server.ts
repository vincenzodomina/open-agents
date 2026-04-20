import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  getSupabaseAnonKey,
  getSupabaseAuthStorageKey,
  getSupabaseServerUrl,
} from "./config";

export async function createClient() {
  const cookieStore = await cookies();
  const storageKey = getSupabaseAuthStorageKey();

  return createServerClient(
    getSupabaseServerUrl()!,
    getSupabaseAnonKey()!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options: CookieOptions;
          }[],
        ) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component; middleware refreshes the session.
          }
        },
      },
      cookieOptions: storageKey
        ? {
            name: storageKey,
          }
        : undefined,
    },
  );
}
