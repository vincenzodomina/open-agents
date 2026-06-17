import "server-only";
import {
  createRuntimeClient,
  type RuntimeClient,
} from "@open-harness/runtime-core/runtime-client";
import { getSupabaseAccessToken } from "./access-token";
import { getRuntimeConnectionConfig } from "./config";

export function getRuntimeClient(): RuntimeClient {
  const config = getRuntimeConnectionConfig();
  return createRuntimeClient({
    baseUrl: config.url,
    getAccessToken: () => getSupabaseAccessToken(),
  });
}
