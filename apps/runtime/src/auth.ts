import {
  type AuthenticatedUser,
  verifyBearerToken,
} from "@open-harness/runtime-core/bearer-auth";
import type { RuntimeConfig } from "./config.ts";

export type AuthContext = {
  user: AuthenticatedUser;
  token: string;
};

export async function authenticate(
  request: Request,
  config: RuntimeConfig,
): Promise<
  { ok: true; context: AuthContext } | { ok: false; response: Response }
> {
  const result = await verifyBearerToken(request, {
    supabaseUrl: config.supabaseUrl,
    supabaseAnonKey: config.supabaseAnonKey,
  });
  if (!result.ok) {
    return {
      ok: false,
      response: Response.json(
        { error: result.reason },
        {
          status: result.status,
          headers: { "www-authenticate": 'Bearer realm="runtime"' },
        },
      ),
    };
  }
  return {
    ok: true,
    context: { user: result.user, token: result.token },
  };
}
