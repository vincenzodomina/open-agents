import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
} from "bun:test";
import { proxyWithTokenRefresh } from "./token-refresh";

type Capture = {
  authorization: string | null;
  method: string;
  path: string;
  body: string;
  headers: Record<string, string>;
};

type ServerInfo = {
  url: string;
  stop: () => void;
  calls: () => Capture[];
  reset: () => void;
  setHandler: (handler: (req: Request) => Response | Promise<Response>) => void;
};

let server: ServerInfo;

beforeAll(() => {
  const captured: Capture[] = [];
  let handler: (req: Request) => Response | Promise<Response> = () =>
    new Response("default", { status: 200 });
  const bunServer = Bun.serve({
    port: 0,
    async fetch(req) {
      const url = new URL(req.url);
      const body = req.body ? await req.text() : "";
      const headers: Record<string, string> = {};
      for (const [name, value] of req.headers) {
        headers[name.toLowerCase()] = value;
      }
      captured.push({
        authorization: req.headers.get("authorization"),
        method: req.method,
        path: url.pathname + url.search,
        body,
        headers,
      });
      const cloned = new Request(req.url, {
        method: req.method,
        headers: req.headers,
        body: body || undefined,
      });
      return handler(cloned);
    },
  });
  server = {
    url: `http://127.0.0.1:${bunServer.port}`,
    stop: () => bunServer.stop(),
    calls: () => captured.slice(),
    reset: () => {
      captured.length = 0;
      handler = () => new Response("default", { status: 200 });
    },
    setHandler: (h) => {
      handler = h;
    },
  };
});

afterAll(() => {
  server.stop();
});

beforeEach(() => {
  server.reset();
});

describe("proxyWithTokenRefresh", () => {
  test("passes through on happy path without refreshing", async () => {
    server.setHandler(() => Response.json({ ok: true }));
    let refreshCount = 0;
    const req = new Request("http://frontend/api/runtime/v1/thing", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ hello: "world" }),
    });

    const res = await proxyWithTokenRefresh({
      runtimeBaseUrl: server.url,
      tokenProvider: {
        getToken: async () => "tok_fresh",
        refreshToken: async () => {
          refreshCount += 1;
          return "tok_new";
        },
      },
      request: req,
      targetPath: "/v1/thing",
    });

    expect(res.status).toBe(200);
    expect(refreshCount).toBe(0);
    const calls = server.calls();
    expect(calls.length).toBe(1);
    expect(calls[0]?.authorization).toBe("Bearer tok_fresh");
    expect(calls[0]?.body).toBe(JSON.stringify({ hello: "world" }));
  });

  test("refreshes token and retries once when runtime returns 401", async () => {
    let callIndex = 0;
    server.setHandler(() => {
      callIndex += 1;
      if (callIndex === 1) {
        return new Response(JSON.stringify({ error: "invalid_token" }), {
          status: 401,
          headers: { "content-type": "application/json" },
        });
      }
      return Response.json({ ok: true, attempt: callIndex });
    });
    let refreshCount = 0;
    const req = new Request("http://frontend/api/runtime/v1/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: "hi" }),
    });

    const res = await proxyWithTokenRefresh({
      runtimeBaseUrl: server.url,
      tokenProvider: {
        getToken: async () => "tok_stale",
        refreshToken: async () => {
          refreshCount += 1;
          return "tok_fresh";
        },
      },
      request: req,
      targetPath: "/v1/chat",
    });

    expect(res.status).toBe(200);
    expect(refreshCount).toBe(1);
    const calls = server.calls();
    expect(calls.length).toBe(2);
    expect(calls[0]?.authorization).toBe("Bearer tok_stale");
    expect(calls[1]?.authorization).toBe("Bearer tok_fresh");
    expect(calls[0]?.body).toBe(JSON.stringify({ message: "hi" }));
    expect(calls[1]?.body).toBe(JSON.stringify({ message: "hi" }));
  });

  test("does not retry on non-401 status", async () => {
    server.setHandler(() => new Response("bad", { status: 500 }));
    let refreshCount = 0;
    const req = new Request("http://frontend/api/runtime/v1/thing", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    });

    const res = await proxyWithTokenRefresh({
      runtimeBaseUrl: server.url,
      tokenProvider: {
        getToken: async () => "tok_stale",
        refreshToken: async () => {
          refreshCount += 1;
          return "tok_fresh";
        },
      },
      request: req,
      targetPath: "/v1/thing",
    });

    expect(res.status).toBe(500);
    expect(refreshCount).toBe(0);
    expect(server.calls().length).toBe(1);
  });

  test("surfaces 401 when refresh returns undefined", async () => {
    server.setHandler(
      () =>
        new Response(JSON.stringify({ error: "invalid_token" }), {
          status: 401,
          headers: {
            "content-type": "application/json",
            "www-authenticate": 'Bearer realm="runtime"',
          },
        }),
    );
    const req = new Request("http://frontend/api/runtime/v1/thing", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    });

    const res = await proxyWithTokenRefresh({
      runtimeBaseUrl: server.url,
      tokenProvider: {
        getToken: async () => "tok_stale",
        refreshToken: async () => undefined,
      },
      request: req,
      targetPath: "/v1/thing",
    });

    expect(res.status).toBe(401);
    expect(res.headers.get("www-authenticate")).toBe('Bearer realm="runtime"');
    expect(server.calls().length).toBe(1);
  });

  test("surfaces 401 when refresh throws", async () => {
    server.setHandler(() => new Response("unauthorized", { status: 401 }));
    const req = new Request("http://frontend/api/runtime/v1/thing", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    });

    const res = await proxyWithTokenRefresh({
      runtimeBaseUrl: server.url,
      tokenProvider: {
        getToken: async () => "tok_stale",
        refreshToken: async () => {
          throw new Error("network down");
        },
      },
      request: req,
      targetPath: "/v1/thing",
    });

    expect(res.status).toBe(401);
    expect(server.calls().length).toBe(1);
  });

  test("does not retry when refresh returns the same token", async () => {
    server.setHandler(() => new Response("unauthorized", { status: 401 }));
    let refreshCount = 0;
    const req = new Request("http://frontend/api/runtime/v1/thing", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    });

    const res = await proxyWithTokenRefresh({
      runtimeBaseUrl: server.url,
      tokenProvider: {
        getToken: async () => "tok_same",
        refreshToken: async () => {
          refreshCount += 1;
          return "tok_same";
        },
      },
      request: req,
      targetPath: "/v1/thing",
    });

    expect(res.status).toBe(401);
    expect(refreshCount).toBe(1);
    expect(server.calls().length).toBe(1);
  });

  test("retries GET requests without body", async () => {
    let callIndex = 0;
    server.setHandler(() => {
      callIndex += 1;
      if (callIndex === 1) {
        return new Response("unauthorized", { status: 401 });
      }
      return Response.json({ ok: true });
    });
    const req = new Request("http://frontend/api/runtime/v1/whoami", {
      method: "GET",
    });

    const res = await proxyWithTokenRefresh({
      runtimeBaseUrl: server.url,
      tokenProvider: {
        getToken: async () => "tok_stale",
        refreshToken: async () => "tok_fresh",
      },
      request: req,
      targetPath: "/v1/whoami",
    });

    expect(res.status).toBe(200);
    const calls = server.calls();
    expect(calls.length).toBe(2);
    expect(calls[0]?.method).toBe("GET");
    expect(calls[1]?.method).toBe("GET");
    expect(calls[0]?.authorization).toBe("Bearer tok_stale");
    expect(calls[1]?.authorization).toBe("Bearer tok_fresh");
  });

  test("only retries once even if refreshed token still returns 401", async () => {
    server.setHandler(() => new Response("unauthorized", { status: 401 }));
    let refreshCount = 0;
    const req = new Request("http://frontend/api/runtime/v1/thing", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    });

    const res = await proxyWithTokenRefresh({
      runtimeBaseUrl: server.url,
      tokenProvider: {
        getToken: async () => "tok_stale",
        refreshToken: async () => {
          refreshCount += 1;
          return "tok_also_stale";
        },
      },
      request: req,
      targetPath: "/v1/thing",
    });

    expect(res.status).toBe(401);
    expect(refreshCount).toBe(1);
    const calls = server.calls();
    expect(calls.length).toBe(2);
    expect(calls[0]?.authorization).toBe("Bearer tok_stale");
    expect(calls[1]?.authorization).toBe("Bearer tok_also_stale");
  });

  test("preserves streaming response body on successful retry", async () => {
    let callIndex = 0;
    server.setHandler(() => {
      callIndex += 1;
      if (callIndex === 1) {
        return new Response("unauthorized", { status: 401 });
      }
      const encoder = new TextEncoder();
      const stream = new ReadableStream<Uint8Array>({
        async start(controller) {
          controller.enqueue(encoder.encode("chunk1\n"));
          await new Promise((resolve) => setTimeout(resolve, 5));
          controller.enqueue(encoder.encode("chunk2\n"));
          controller.close();
        },
      });
      return new Response(stream, {
        headers: { "content-type": "text/plain" },
      });
    });

    const req = new Request("http://frontend/api/runtime/v1/echo-stream", {
      method: "POST",
      headers: { "content-type": "text/plain" },
      body: "hello world",
    });

    const res = await proxyWithTokenRefresh({
      runtimeBaseUrl: server.url,
      tokenProvider: {
        getToken: async () => "tok_stale",
        refreshToken: async () => "tok_fresh",
      },
      request: req,
      targetPath: "/v1/echo-stream",
    });

    expect(res.status).toBe(200);
    expect(res.body).not.toBeNull();
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let collected = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      collected += decoder.decode(value);
    }
    expect(collected).toBe("chunk1\nchunk2\n");
  });
});
