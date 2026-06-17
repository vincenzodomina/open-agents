import "server-only";
import { proxyWithTokenRefresh } from "@open-harness/runtime-core/token-refresh";
import { createSupabaseTokenProvider } from "./access-token";
import { getRuntimeConnectionConfig } from "./config";

export async function forwardToRuntime(
  request: Request,
  targetPath: string,
): Promise<Response> {
  const config = getRuntimeConnectionConfig();
  const tokenProvider = createSupabaseTokenProvider();

  try {
    return await proxyWithTokenRefresh({
      runtimeBaseUrl: config.url,
      tokenProvider,
      request,
      targetPath,
      signal: request.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return new Response(null, { status: 499 });
    }
    console.error("[runtime-proxy] upstream error", error);
    return Response.json(
      { error: "runtime_unreachable", mode: config.mode, url: config.url },
      { status: 502 },
    );
  }
}
