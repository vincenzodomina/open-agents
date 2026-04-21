const SUPABASE_BROWSER_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || undefined;
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || undefined;

function getStorageHostname(url: string): string {
  return new URL(url).hostname.split(".")[0] ?? "";
}

export function getSupabaseBrowserUrl(): string | undefined {
  return SUPABASE_BROWSER_URL;
}

export function getSupabaseAnonKey(): string | undefined {
  return SUPABASE_ANON_KEY;
}

export function getSupabaseAuthStorageKey(): string | undefined {
  const browserUrl = getSupabaseBrowserUrl();
  if (!browserUrl) {
    return undefined;
  }

  return `sb-${getStorageHostname(browserUrl)}-auth-token`;
}
