export type RuntimeClient = {
  baseUrl: string;
  fetch: (path: string, init?: RequestInit) => Promise<Response>;
  health: () => Promise<{ ok: boolean; status: number }>;
};

export type RuntimeClientOptions = {
  baseUrl: string;
  getAccessToken: () => string | undefined | Promise<string | undefined>;
  fetchImpl?: typeof fetch;
};

export function createRuntimeClient(
  options: RuntimeClientOptions,
): RuntimeClient {
  const fetchImpl = options.fetchImpl ?? fetch;
  const baseUrl = options.baseUrl.replace(/\/$/, "");

  const sendRequest = async (
    path: string,
    init: RequestInit = {},
  ): Promise<Response> => {
    const token = await options.getAccessToken();
    const headers = new Headers(init.headers);
    if (token && !headers.has("authorization")) {
      headers.set("authorization", `Bearer ${token}`);
    }
    const url = path.startsWith("http")
      ? path
      : `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;
    return fetchImpl(url, { ...init, headers });
  };

  return {
    baseUrl,
    fetch: sendRequest,
    health: async () => {
      try {
        const res = await sendRequest("/v1/health", { method: "GET" });
        return { ok: res.ok, status: res.status };
      } catch {
        return { ok: false, status: 0 };
      }
    },
  };
}
