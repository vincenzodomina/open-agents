import { hasSupabaseServerConfig } from "@/lib/supabase/server-config";
import { createClient } from "@/lib/supabase/server";

export async function POST(): Promise<Response> {
  if (hasSupabaseServerConfig()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  return new Response(null, {
    status: 303,
    headers: {
      Location: "/",
    },
  });
}
