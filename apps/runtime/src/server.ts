import { getWorld } from "workflow/runtime";
import { loadRuntimeConfig } from "./config.ts";
import { handleRequest } from "./routes.ts";
import { handleWorkflowControlPlane } from "./workflow-control-plane.ts";

const config = loadRuntimeConfig();

await getWorld().start?.();

const server = Bun.serve({
  hostname: config.host,
  port: config.port,
  idleTimeout: 240,
  fetch: async (request) => {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/.well-known/workflow/v1/")) {
      return handleWorkflowControlPlane(request, url);
    }
    return handleRequest(request, config);
  },
  error: (error) => {
    console.error("[runtime] unhandled error", error);
    return Response.json({ error: "internal_error" }, { status: 500 });
  },
});

console.log(`[runtime] listening on http://${server.hostname}:${server.port}`);

const shutdown = (signal: string) => {
  console.log(`[runtime] received ${signal}, shutting down`);
  server.stop();
  process.exit(0);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
