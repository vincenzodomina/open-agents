import {
  type ConnectionMode,
  parseConnectionMode,
} from "@open-harness/runtime-core/connection-mode";

export type DesktopConfig = {
  frontendPort: number;
  runtimeMode: ConnectionMode;
  runtimeUrl: string | undefined;
  runtimeHost: string;
  runtimePort: number;
  workflowRuntimeUrl: string | undefined;
  workflowRuntimeHost: string;
  workflowRuntimePort: number;
  sshTarget: string | undefined;
  sshRemotePort: number | undefined;
  sshWorkflowRemotePort: number | undefined;
  repoRoot: string;
};

export function loadDesktopConfig(repoRoot: string): DesktopConfig {
  return {
    frontendPort: Number.parseInt(process.env.FRONTEND_PORT || "3000", 10),
    runtimeMode: parseConnectionMode(process.env.SERVER_CONNECTION_MODE),
    runtimeUrl: process.env.SERVER_CONNECTION_URL?.trim() || undefined,
    runtimeHost: process.env.RUNTIME_HOST?.trim() || "127.0.0.1",
    runtimePort: Number.parseInt(process.env.RUNTIME_PORT || "3001", 10),
    workflowRuntimeUrl:
      process.env.WORKFLOW_CONNECTION_URL?.trim() || undefined,
    workflowRuntimeHost:
      process.env.WORKFLOW_RUNTIME_HOST?.trim() || "127.0.0.1",
    workflowRuntimePort: Number.parseInt(
      process.env.WORKFLOW_RUNTIME_PORT || "3002",
      10,
    ),
    sshTarget: process.env.SSH_TARGET?.trim() || undefined,
    sshRemotePort: process.env.SSH_REMOTE_PORT
      ? Number.parseInt(process.env.SSH_REMOTE_PORT, 10)
      : undefined,
    sshWorkflowRemotePort: process.env.SSH_WORKFLOW_REMOTE_PORT
      ? Number.parseInt(process.env.SSH_WORKFLOW_REMOTE_PORT, 10)
      : undefined,
    repoRoot,
  };
}
