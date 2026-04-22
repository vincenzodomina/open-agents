import path from "node:path";
import type { DesktopConfig } from "./config.js";
import { waitForHttp } from "./health.js";
import { ManagedProcess } from "./process-manager.js";
import { type SshTunnelHandle, openSshTunnel } from "./ssh-tunnel.js";

export type WorkflowRuntimeHandle = {
  url: string;
  stop: () => Promise<void>;
};

export async function startWorkflowRuntime(
  config: DesktopConfig,
): Promise<WorkflowRuntimeHandle> {
  switch (config.runtimeMode) {
    case "embedded":
      return startEmbedded(config);
    case "http":
      return connectHttp(config);
    case "ssh":
      return connectSsh(config);
  }
}

async function startEmbedded(
  config: DesktopConfig,
): Promise<WorkflowRuntimeHandle> {
  const cwd = path.join(config.repoRoot, "apps", "workflow-runtime");
  const url = `http://${config.workflowRuntimeHost}:${config.workflowRuntimePort}`;
  const process = new ManagedProcess({
    label: "workflow",
    command: "node",
    args: [".output/server/index.mjs"],
    cwd,
    env: {
      PORT: String(config.workflowRuntimePort),
      HOST: config.workflowRuntimeHost,
    },
  });
  process.start();
  await waitForHttp({
    url: `${url}/api/health`,
    label: "workflow-runtime",
    timeoutMs: 45_000,
  });
  return {
    url,
    stop: () => process.stop(),
  };
}

async function connectHttp(
  config: DesktopConfig,
): Promise<WorkflowRuntimeHandle> {
  if (!config.workflowRuntimeUrl) {
    throw new Error(
      "WORKFLOW_CONNECTION_URL is required when SERVER_CONNECTION_MODE=http",
    );
  }
  await waitForHttp({
    url: `${config.workflowRuntimeUrl}/api/health`,
    label: "workflow-runtime (http)",
  });
  return {
    url: config.workflowRuntimeUrl,
    stop: async () => undefined,
  };
}

async function connectSsh(
  config: DesktopConfig,
): Promise<WorkflowRuntimeHandle> {
  if (!config.sshTarget) {
    throw new Error("SSH_TARGET is required when SERVER_CONNECTION_MODE=ssh");
  }
  const remotePort = config.sshWorkflowRemotePort ?? 3002;
  const tunnel: SshTunnelHandle = await openSshTunnel({
    target: config.sshTarget,
    remotePort,
    localPort: config.workflowRuntimePort,
    localHost: config.workflowRuntimeHost,
  });
  await waitForHttp({
    url: `${tunnel.localUrl}/api/health`,
    label: "workflow-runtime (ssh)",
  });
  return {
    url: tunnel.localUrl,
    stop: () => tunnel.close(),
  };
}
