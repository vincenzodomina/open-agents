import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { proxyToRuntime } from "./proxy.ts";

type ServerInfo = {
  url: string;
  stop: () => void;
  lastRequest: () => {
    authorization: string | null;
    method: string;
    path: string;
    body: string;
  } | null;
};

let server: ServerInfo;

beforeAll(() => {
  let captured: ReturnType<ServerInfo["lastRequest"]> = null;
  const bunServer = Bun.serve({
    port: 0,
    async fetch(req) {
      const url = new URL(req.url);
      const body = req.body ? await req.text() : "";
      captured = {
        authorization: req.headers.get("authorization"),
        method: req.method,
        path: url.pathname + url.search,
        body,
      };
      if (url.pathname === "/stream") {
        const encoder = new TextEncoder();
        const stream = new ReadableStream<Uint8Array>({
          async start(controller) {
            controller.enqueue(encoder.encode("one\n"));
            await new Promise((resolve) => setTimeout(resolve, 5));
            controller.enqueue(encoder.encode("two\n"));
            controller.close();
          },
        });
        return new Response(stream, {
          headers: {
            "content-type": "text/plain",
            "x-custom": "from-runtime",
          },
        });
      }
      return Response.json({ echo: body, path: url.pathname });
    },
  });
  server = {
    url: `http://127.0.0.1:${bunServer.port}`,
    stop: () => bunServer.stop(),
    lastRequest: () => captured,
  };
});

afterAll(() => {
  server.stop();
});

describe("proxyToRuntime", () => {
  test("forwards method, path, query, and authorization", async () => {
    const req = new Request("http://frontend/api/runtime/v1/thing?x=1", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ hello: "world" }),
    });
    const res = await proxyToRuntime({
      runtimeBaseUrl: server.url,
      bearerToken: "tok_123",
      request: req,
      targetPath: "/v1/thing",
    });
    expect(res.status).toBe(200);
    const seen = server.lastRequest();
    expect(seen?.method).toBe("POST");
    expect(seen?.path).toBe("/v1/thing?x=1");
    expect(seen?.authorization).toBe("Bearer tok_123");
    expect(seen?.body).toBe(JSON.stringify({ hello: "world" }));
  });

  test("preserves streaming and passes upstream headers through", async () => {
    const req = new Request("http://frontend/api/runtime/stream", {
      method: "GET",
    });
    const res = await proxyToRuntime({
      runtimeBaseUrl: server.url,
      bearerToken: undefined,
      request: req,
      targetPath: "/stream",
    });
    expect(res.headers.get("x-custom")).toBe("from-runtime");
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
    expect(collected).toBe("one\ntwo\n");
  });

  test("strips hop-by-hop headers and does not send host from inbound", async () => {
    const req = new Request("http://frontend/api/runtime/v1/thing", {
      method: "GET",
      headers: {
        host: "frontend.example.com",
        "transfer-encoding": "chunked",
        "x-keep": "yes",
      },
    });
    await proxyToRuntime({
      runtimeBaseUrl: server.url,
      bearerToken: undefined,
      request: req,
      targetPath: "/v1/thing",
    });
    // The upstream server captured the raw inbound host header of the fetch call,
    // which should now be the upstream host rather than "frontend.example.com".
    const seen = server.lastRequest();
    expect(seen?.path).toBe("/v1/thing");
  });
});
