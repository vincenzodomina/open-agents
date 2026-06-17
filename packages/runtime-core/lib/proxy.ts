const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "host",
  "content-length",
]);

export type ProxyOptions = {
  runtimeBaseUrl: string;
  bearerToken: string | undefined;
  request: Request;
  targetPath: string;
  signal?: AbortSignal;
};

export async function proxyToRuntime(options: ProxyOptions): Promise<Response> {
  const { runtimeBaseUrl, bearerToken, request, targetPath, signal } = options;

  const incomingUrl = new URL(request.url);
  const targetUrl = new URL(targetPath, runtimeBaseUrl);
  targetUrl.search = incomingUrl.search;

  const forwardedHeaders = new Headers();
  for (const [name, value] of request.headers) {
    if (!HOP_BY_HOP_HEADERS.has(name.toLowerCase())) {
      forwardedHeaders.set(name, value);
    }
  }
  if (bearerToken) {
    forwardedHeaders.set("authorization", `Bearer ${bearerToken}`);
  }

  const method = request.method.toUpperCase();
  const bodyAllowed = method !== "GET" && method !== "HEAD";

  const init: RequestInit & { duplex?: "half" } = {
    method,
    headers: forwardedHeaders,
    body: bodyAllowed ? request.body : undefined,
    signal,
    redirect: "manual",
  };
  if (bodyAllowed) {
    // Required by undici/Node runtimes when streaming a request body; ignored by Bun.
    init.duplex = "half";
  }
  const upstream = await fetch(targetUrl, init);

  const responseHeaders = new Headers();
  for (const [name, value] of upstream.headers) {
    if (!HOP_BY_HOP_HEADERS.has(name.toLowerCase())) {
      responseHeaders.set(name, value);
    }
  }

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}
