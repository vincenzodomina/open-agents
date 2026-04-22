import type { AuthContext } from "./auth.ts";
import { authenticate } from "./auth.ts";
import type { RuntimeConfig } from "./config.ts";

export type RouteHandler = (
  request: Request,
  context: AuthContext,
) => Response | Promise<Response>;

type Route = {
  method: string;
  path: string;
  requiresAuth: boolean;
  handler: (
    request: Request,
    context: AuthContext | null,
  ) => Response | Promise<Response>;
};

const routes: Route[] = [
  {
    method: "GET",
    path: "/v1/health",
    requiresAuth: false,
    handler: () =>
      Response.json({ status: "ok", service: "runtime", ts: Date.now() }),
  },
  {
    method: "GET",
    path: "/v1/whoami",
    requiresAuth: true,
    handler: (_req, context) =>
      Response.json({
        userId: context?.user.id,
        email: context?.user.email,
      }),
  },
  {
    method: "POST",
    path: "/v1/echo-stream",
    requiresAuth: true,
    handler: async (request, context) => {
      const body = await request.text();
      const encoder = new TextEncoder();
      const stream = new ReadableStream<Uint8Array>({
        async start(controller) {
          controller.enqueue(
            encoder.encode(`user:${context?.user.id ?? "unknown"}\n`),
          );
          for (const chunk of body.split(/\s+/).filter(Boolean)) {
            controller.enqueue(encoder.encode(`${chunk}\n`));
            await new Promise((resolve) => setTimeout(resolve, 20));
          }
          controller.close();
        },
      });
      return new Response(stream, {
        headers: {
          "content-type": "text/plain; charset=utf-8",
          "cache-control": "no-store",
          "x-accel-buffering": "no",
        },
      });
    },
  },
];

export async function handleRequest(
  request: Request,
  config: RuntimeConfig,
): Promise<Response> {
  const url = new URL(request.url);
  const route = routes.find(
    (r) => r.method === request.method && r.path === url.pathname,
  );
  if (!route) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }
  if (!route.requiresAuth) {
    return route.handler(request, null);
  }
  const auth = await authenticate(request, config);
  if (!auth.ok) {
    return auth.response;
  }
  return route.handler(request, auth.context);
}
