import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type AuthenticatedUser = {
  id: string;
  email: string | undefined;
};

export type BearerAuthResult =
  | { ok: true; user: AuthenticatedUser; token: string }
  | { ok: false; status: 401 | 403; reason: string };

type VerifierDeps = {
  supabaseUrl: string;
  supabaseAnonKey: string;
};

let cachedClient: SupabaseClient | undefined;
let cachedKey: string | undefined;

function getClient(deps: VerifierDeps): SupabaseClient {
  const key = `${deps.supabaseUrl}|${deps.supabaseAnonKey}`;
  if (cachedClient && cachedKey === key) {
    return cachedClient;
  }
  cachedClient = createClient(deps.supabaseUrl, deps.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  cachedKey = key;
  return cachedClient;
}

export async function verifyBearerToken(
  request: Request,
  deps: VerifierDeps,
): Promise<BearerAuthResult> {
  const header = request.headers.get("authorization");
  if (!header) {
    return { ok: false, status: 401, reason: "missing_authorization_header" };
  }
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match?.[1]) {
    return { ok: false, status: 401, reason: "malformed_authorization_header" };
  }
  const token = match[1];
  const client = getClient(deps);
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) {
    return { ok: false, status: 401, reason: "invalid_token" };
  }
  return {
    ok: true,
    token,
    user: { id: data.user.id, email: data.user.email },
  };
}
