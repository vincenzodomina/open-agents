import { type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(_req: NextRequest): Promise<Response> {
  const hasSupabase =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (hasSupabase) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  return Response.redirect(new URL("/", _req.url));
}
