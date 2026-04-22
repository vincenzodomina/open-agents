import "server-only";
import { proxyToRuntime } from "@open-harness/runtime-core/proxy";
import { getSupabaseAccessToken } from "./access-token";
import { getRuntimeConnectionConfig } from "./config";

export async function forwardToRuntime(
  request: Request,
  targetPath: string,
): Promise<Response> {
  const config = getRuntimeConnectionConfig();
  const token = await getSupabaseAccessToken();

  try {
    return await proxyToRuntime({
      runtimeBaseUrl: config.url,
      bearerToken: token,
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
