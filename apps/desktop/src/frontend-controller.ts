import path from "node:path";
import type { DesktopConfig } from "./config.js";
import { waitForHttp } from "./health.js";
import { ManagedProcess } from "./process-manager.js";

export type FrontendHandle = {
  url: string;
  stop: () => Promise<void>;
};

export async function startFrontend(
  config: DesktopConfig,
  runtimeUrl: string,
): Promise<FrontendHandle> {
  const webCwd = path.join(config.repoRoot, "apps", "web");
  const url = `http://127.0.0.1:${config.frontendPort}`;
  const process = new ManagedProcess({
    label: "web",
    command: "bun",
    args: ["run", "start", "--", "--port", String(config.frontendPort)],
    cwd: webCwd,
    env: {
      SERVER_CONNECTION_MODE: "http",
      SERVER_CONNECTION_URL: runtimeUrl,
      PORT: String(config.frontendPort),
    },
  });
  process.start();
  await waitForHttp({ url, label: "frontend", timeoutMs: 60_000 });
  return {
    url,
    stop: () => process.stop(),
  };
}
