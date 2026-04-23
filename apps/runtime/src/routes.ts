import { handleChatRunStop } from "./api/chat/run-stop.ts";
import { handleChatRunStream } from "./api/chat/run-stream.ts";
import { handleChatStart } from "./api/chat/start.ts";
import { handleRunStatus } from "./api/run-status.ts";
import { handleSandboxLifecycleKick } from "./api/sandbox/lifecycle-kick.ts";
import type { AuthContext } from "./auth.ts";
import { authenticate } from "./auth.ts";
import type { RuntimeConfig } from "./config.ts";
import { handleGenerateCommitMessage } from "./handlers/generate-commit-message.ts";
import { handleGenerateTitle } from "./handlers/generate-title.ts";
import { handleTranscribe } from "./handlers/transcribe.ts";

type AuthedHandler = (
  request: Request,
  context: AuthContext,
  params: Record<string, string>,
) => Response | Promise<Response>;

type PublicHandler = (request: Request) => Response | Promise<Response>;

type AuthedRoute = {
  method: string;
  pattern: string;
  segments: string[];
  requiresAuth: true;
  handler: AuthedHandler;
};

type PublicRoute = {
  method: string;
  pattern: string;
  segments: string[];
  requiresAuth: false;
  handler: PublicHandler;
};

type Route = AuthedRoute | PublicRoute;

function authed(
  route: Omit<AuthedRoute, "segments" | "requiresAuth">,
): AuthedRoute {
  return {
    ...route,
    requiresAuth: true,
    segments: route.pattern.split("/"),
  };
}

function publicRoute(
  route: Omit<PublicRoute, "segments" | "requiresAuth">,
): PublicRoute {
  return {
    ...route,
    requiresAuth: false,
    segments: route.pattern.split("/"),
  };
}

const routes: Route[] = [
  publicRoute({
    method: "GET",
    pattern: "/v1/health",
    handler: () =>
      Response.json({ status: "ok", service: "runtime", ts: Date.now() }),
  }),
  authed({
    method: "GET",
    pattern: "/v1/whoami",
    handler: (_req, context) =>
      Response.json({
        userId: context.user.id,
        email: context.user.email,
      }),
  }),
  authed({
    method: "POST",
    pattern: "/v1/echo-stream",
    handler: async (request, context) => {
      const body = await request.text();
      const encoder = new TextEncoder();
      const stream = new ReadableStream<Uint8Array>({
        async start(controller) {
          controller.enqueue(encoder.encode(`user:${context.user.id}\n`));
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
  }),
  authed({
    method: "POST",
    pattern: "/v1/generate-title",
    handler: (request) => handleGenerateTitle(request),
  }),
  authed({
    method: "POST",
    pattern: "/v1/generate-commit-message",
    handler: (request) => handleGenerateCommitMessage(request),
  }),
  authed({
    method: "POST",
    pattern: "/v1/transcribe",
    handler: (request) => handleTranscribe(request),
  }),
  authed({
    method: "POST",
    pattern: "/v1/chat/start",
    handler: (request, context) => handleChatStart(request, context),
  }),
  authed({
    method: "GET",
    pattern: "/v1/chat/runs/:id/stream",
    handler: (request, context, params) =>
      handleChatRunStream(request, context, params),
  }),
  authed({
    method: "POST",
    pattern: "/v1/chat/runs/:id/stop",
    handler: (request, context, params) =>
      handleChatRunStop(request, context, params),
  }),
  authed({
    method: "GET",
    pattern: "/v1/runs/:id",
    handler: (request, context, params) =>
      handleRunStatus(request, context, params),
  }),
  authed({
    method: "POST",
    pattern: "/v1/sandbox/lifecycle/kick",
    handler: (request, context) => handleSandboxLifecycleKick(request, context),
  }),
];

function matchPath(
  segments: string[],
  pathname: string,
): Record<string, string> | null {
  const pathSegments = pathname.split("/");
  if (segments.length !== pathSegments.length) {
    return null;
  }
  const params: Record<string, string> = {};
  for (let i = 0; i < segments.length; i++) {
    const pattern = segments[i] ?? "";
    const value = pathSegments[i] ?? "";
    if (pattern.startsWith(":")) {
      params[pattern.slice(1)] = value;
    } else if (pattern !== value) {
      return null;
    }
  }
  return params;
}

export async function handleRequest(
  request: Request,
  config: RuntimeConfig,
): Promise<Response> {
  const url = new URL(request.url);
  for (const route of routes) {
    if (route.method !== request.method) {
      continue;
    }
    const params = matchPath(route.segments, url.pathname);
    if (!params) {
      continue;
    }
    if (!route.requiresAuth) {
      return route.handler(request);
    }
    const auth = await authenticate(request, config);
    if (!auth.ok) {
      return auth.response;
    }
    return route.handler(request, auth.context, params);
  }
  return Response.json({ error: "not_found" }, { status: 404 });
}
