import { NextResponse, type NextRequest } from "next/server";
import { hasSupabaseServerConfig } from "@/lib/supabase/server-config";
import { updateSession } from "@/lib/supabase/middleware";

function wantsSharedMarkdown(acceptHeader: string | null): boolean {
  if (!acceptHeader) {
    return false;
  }

  const accept = acceptHeader.toLowerCase();
  return accept.includes("text/markdown") || accept.includes("text/plain");
}

export async function proxy(request: NextRequest) {
  const sessionResponse = hasSupabaseServerConfig()
    ? await updateSession(request)
    : NextResponse.next({ request });

  if (request.method !== "GET") {
    return sessionResponse;
  }

  const pathname = request.nextUrl.pathname;
  const segments = pathname.split("/").filter(Boolean);

  if (
    segments.length === 2 &&
    segments[0] === "shared" &&
    wantsSharedMarkdown(request.headers.get("accept"))
  ) {
    const rewrittenUrl = request.nextUrl.clone();
    rewrittenUrl.pathname = `/api/shared/${segments[1]}/markdown`;
    const rewriteResponse = NextResponse.rewrite(rewrittenUrl);
    sessionResponse.cookies.getAll().forEach((cookie) => {
      rewriteResponse.cookies.set(cookie);
    });
    return rewriteResponse;
  }

  return sessionResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|webmanifest)$).*)",
  ],
};
