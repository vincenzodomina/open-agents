import { verifyBearerToken } from "@open-harness/runtime-core/bearer-auth";
import { getHeader, type H3Event } from "nitro/h3";

export type AuthContext = {
  userId: string;
  email: string | undefined;
  token: string;
};

function requireEnv(key: string): string {
  const value = process.env[key]?.trim();
  if (!value) {
    throw new Error(`Missing required env var: ${key}`);
  }
  return value;
}

function unauthorized(reason: string, status: 401): Response {
  return new Response(JSON.stringify({ error: reason }), {
    status,
    headers: {
      "content-type": "application/json",
      "www-authenticate": 'Bearer realm="workflow-runtime"',
    },
  });
}

export async function requireAuth(
  event: H3Event,
): Promise<AuthContext | Response> {
  const authHeader = getHeader(event, "authorization");
  const proxyRequest = new Request("http://workflow-runtime.local/", {
    headers: authHeader ? { authorization: authHeader } : undefined,
  });
  const result = await verifyBearerToken(proxyRequest, {
    supabaseUrl: requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    supabaseAnonKey: requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  });
  if (!result.ok) {
    return unauthorized(result.reason, result.status);
  }
  return {
    userId: result.user.id,
    email: result.user.email,
    token: result.token,
  };
}
