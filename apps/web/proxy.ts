import { NextResponse, type NextRequest } from "next/server";
import { hasSupabaseServerConfig } from "@/lib/supabase/server-config";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return hasSupabaseServerConfig()
    ? await updateSession(request)
    : NextResponse.next({ request });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|webmanifest)$).*)",
  ],
};
