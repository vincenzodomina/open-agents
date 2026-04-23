import "server-only";
import {
  createRuntimeClient,
  type RuntimeClient,
} from "@open-harness/runtime-core/runtime-client";
import { getSupabaseAccessToken } from "./access-token";
import { getWorkflowConnectionConfig } from "./workflow-config";

export function getWorkflowClient(): RuntimeClient {
  const config = getWorkflowConnectionConfig();
  return createRuntimeClient({
    baseUrl: config.url,
    getAccessToken: () => getSupabaseAccessToken(),
  });
}
