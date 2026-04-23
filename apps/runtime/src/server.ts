import { loadRuntimeConfig } from "./config.ts";
import { handleRequest } from "./routes.ts";

const config = loadRuntimeConfig();

const server = Bun.serve({
  hostname: config.host,
  port: config.port,
  idleTimeout: 240,
  fetch: (request) => handleRequest(request, config),
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
