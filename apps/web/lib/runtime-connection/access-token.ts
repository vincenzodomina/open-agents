import "server-only";
import type { RefreshableTokenProvider } from "@open-harness/runtime-core/token-refresh";
import { createClient } from "@/lib/supabase/server";

export async function getSupabaseAccessToken(): Promise<string | undefined> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token;
}

export function createSupabaseTokenProvider(): RefreshableTokenProvider {
  return {
    async getToken() {
      const supabase = await createClient();
      const { data } = await supabase.auth.getSession();
      return data.session?.access_token;
    },
    async refreshToken() {
      const supabase = await createClient();
      const { data, error } = await supabase.auth.refreshSession();
      if (error || !data.session) {
        return undefined;
      }
      return data.session.access_token;
    },
  };
}
