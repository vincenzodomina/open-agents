import "server-only";
import {
  type ConnectionConfig,
  resolveWorkflowConnectionConfig,
} from "@open-harness/runtime-core/connection-mode";

let cached: ConnectionConfig | undefined;

export function getWorkflowConnectionConfig(): ConnectionConfig {
  if (cached) {
    return cached;
  }
  cached = resolveWorkflowConnectionConfig({
    mode: process.env.SERVER_CONNECTION_MODE,
    url: process.env.WORKFLOW_CONNECTION_URL,
  });
  return cached;
}
