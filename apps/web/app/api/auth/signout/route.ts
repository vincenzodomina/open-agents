import { type NextRequest } from "next/server";
import { hasSupabaseServerConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export async function POST(_req: NextRequest): Promise<Response> {
  if (hasSupabaseServerConfig()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  return Response.redirect(new URL("/", _req.url));
}
