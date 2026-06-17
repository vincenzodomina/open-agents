import "server-only";
import {
  type ConnectionConfig,
  resolveConnectionConfig,
} from "@open-harness/runtime-core/connection-mode";

let cached: ConnectionConfig | undefined;

export function getRuntimeConnectionConfig(): ConnectionConfig {
  if (cached) {
    return cached;
  }
  cached = resolveConnectionConfig({
    mode: process.env.SERVER_CONNECTION_MODE,
    url: process.env.SERVER_CONNECTION_URL,
  });
  return cached;
}
