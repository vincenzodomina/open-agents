import path from "node:path";
import type { DesktopConfig } from "./config.js";
import { waitForHttp } from "./health.js";
import { ManagedProcess } from "./process-manager.js";
import { type SshTunnelHandle, openSshTunnel } from "./ssh-tunnel.js";

export type RuntimeHandle = {
  url: string;
  stop: () => Promise<void>;
};

export async function startRuntime(
  config: DesktopConfig,
): Promise<RuntimeHandle> {
  switch (config.runtimeMode) {
    case "embedded":
      return startEmbeddedRuntime(config);
    case "http":
      return connectHttpRuntime(config);
    case "ssh":
      return connectSshRuntime(config);
  }
}

async function startEmbeddedRuntime(
  config: DesktopConfig,
): Promise<RuntimeHandle> {
  const runtimeCwd = path.join(config.repoRoot, "apps", "runtime");
  const url = `http://${config.runtimeHost}:${config.runtimePort}`;
  const process = new ManagedProcess({
    label: "runtime",
    command: "bun",
    args: ["run", "src/server.ts"],
    cwd: runtimeCwd,
    env: {
      RUNTIME_HOST: config.runtimeHost,
      RUNTIME_PORT: String(config.runtimePort),
    },
  });
  process.start();
  await waitForHttp({ url: `${url}/v1/health`, label: "runtime" });
  return {
    url,
    stop: () => process.stop(),
  };
}

async function connectHttpRuntime(
  config: DesktopConfig,
): Promise<RuntimeHandle> {
  if (!config.runtimeUrl) {
    throw new Error(
      "SERVER_CONNECTION_URL is required when SERVER_CONNECTION_MODE=http",
    );
  }
  await waitForHttp({
    url: `${config.runtimeUrl}/v1/health`,
    label: "runtime (http)",
  });
  return {
    url: config.runtimeUrl,
    stop: async () => undefined,
  };
}

async function connectSshRuntime(
  config: DesktopConfig,
): Promise<RuntimeHandle> {
  if (!config.sshTarget) {
    throw new Error("SSH_TARGET is required when SERVER_CONNECTION_MODE=ssh");
  }
  const remotePort = config.sshRemotePort ?? 3001;
  const tunnel: SshTunnelHandle = await openSshTunnel({
    target: config.sshTarget,
    remotePort,
    localPort: config.runtimePort,
    localHost: config.runtimeHost,
  });
  await waitForHttp({
    url: `${tunnel.localUrl}/v1/health`,
    label: "runtime (ssh)",
  });
  return {
    url: tunnel.localUrl,
    stop: () => tunnel.close(),
  };
}
