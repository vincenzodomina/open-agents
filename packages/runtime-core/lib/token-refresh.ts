import { proxyToRuntime, type ProxyOptions } from "./proxy";

export type RefreshableTokenProvider = {
  getToken: () => Promise<string | undefined>;
  refreshToken: () => Promise<string | undefined>;
};

export type ProxyWithTokenRefreshOptions = Omit<ProxyOptions, "bearerToken"> & {
  tokenProvider: RefreshableTokenProvider;
};

const RETRYABLE_METHODS = new Set([
  "GET",
  "HEAD",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
]);

export async function proxyWithTokenRefresh(
  options: ProxyWithTokenRefreshOptions,
): Promise<Response> {
  const { tokenProvider, request, ...rest } = options;
  const method = request.method.toUpperCase();
  const hasBody = method !== "GET" && method !== "HEAD";
  const canRetry = RETRYABLE_METHODS.has(method);

  const bufferedBody = hasBody ? await request.arrayBuffer() : undefined;
  const headerEntries = Array.from(request.headers.entries());

  const buildRequest = (): Request => {
    const init: RequestInit = {
      method,
      headers: new Headers(headerEntries),
    };
    if (hasBody && bufferedBody) {
      init.body = bufferedBody;
    }
    return new Request(request.url, init);
  };

  const currentToken = await tokenProvider.getToken();
  const firstResponse = await proxyToRuntime({
    ...rest,
    request: buildRequest(),
    bearerToken: currentToken,
  });

  if (firstResponse.status !== 401 || !canRetry) {
    return firstResponse;
  }

  await firstResponse.body?.cancel().catch(() => {
    // Best-effort drain — the retry path builds a new upstream request anyway.
  });

  let refreshedToken: string | undefined;
  try {
    refreshedToken = await tokenProvider.refreshToken();
  } catch {
    refreshedToken = undefined;
  }

  if (!refreshedToken || refreshedToken === currentToken) {
    return new Response(null, {
      status: 401,
      statusText: firstResponse.statusText,
      headers: firstResponse.headers,
    });
  }

  return proxyToRuntime({
    ...rest,
    request: buildRequest(),
    bearerToken: refreshedToken,
  });
}
