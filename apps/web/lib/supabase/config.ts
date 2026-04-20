function getTrimmedEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function getStorageHostname(url: string): string {
  return new URL(url).hostname.split(".")[0] ?? "";
}

export function getSupabaseBrowserUrl(): string | undefined {
  return getTrimmedEnv("NEXT_PUBLIC_SUPABASE_URL");
}

export function getSupabaseServerUrl(): string | undefined {
  return getTrimmedEnv("SUPABASE_INTERNAL_URL") ?? getSupabaseBrowserUrl();
}

export function getSupabaseAnonKey(): string | undefined {
  return getTrimmedEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

export function getSupabaseAuthStorageKey(): string | undefined {
  const browserUrl = getSupabaseBrowserUrl();
  if (!browserUrl) {
    return undefined;
  }

  return `sb-${getStorageHostname(browserUrl)}-auth-token`;
}

export function hasSupabaseServerConfig(): boolean {
  return Boolean(getSupabaseServerUrl() && getSupabaseAnonKey());
}
