import { type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { getServerSession } from "@/lib/session/get-server-session";
import { SESSION_COOKIE_NAME } from "@/lib/session/constants";
import { createClient } from "@/lib/supabase/server";
import { revokeVercelToken } from "@/lib/vercel/oauth";
import { getUserVercelToken } from "@/lib/vercel/token";

export async function POST(req: NextRequest): Promise<Response> {
  const session = await getServerSession();

  const hasSupabase =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (hasSupabase) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  if (session?.user?.id) {
    if (session.authProvider === "vercel") {
      try {
        const clientId = process.env.NEXT_PUBLIC_VERCEL_APP_CLIENT_ID;
        const clientSecret = process.env.VERCEL_APP_CLIENT_SECRET;
        if (clientId && clientSecret) {
          const token = await getUserVercelToken(session.user.id);
          if (token) {
            await revokeVercelToken({ token, clientId, clientSecret });
          }
        }
      } catch (error) {
        console.error(
          "Failed to revoke Vercel token:",
          error instanceof Error ? error.message : "Unknown error",
        );
      }
    }
  }

  const store = await cookies();
  store.delete(SESSION_COOKIE_NAME);

  return Response.redirect(new URL("/", req.url));
}
