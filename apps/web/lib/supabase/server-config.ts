import { existsSync } from "node:fs";
import { getSupabaseAnonKey, getSupabaseBrowserUrl } from "./config";

const DOCKER_HOSTNAME = "host.docker.internal";
const LOOPBACK_HOSTNAMES = new Set([
  "127.0.0.1",
  "0.0.0.0",
  "localhost",
  "::1",
  "[::1]",
]);
const IS_RUNNING_IN_DOCKER = existsSync("/.dockerenv");

function getTrimmedServerEnv(
  name: "SUPABASE_INTERNAL_URL",
): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function isLoopbackHostname(hostname: string): boolean {
  return LOOPBACK_HOSTNAMES.has(hostname);
}

function rewriteLoopbackUrlForDocker(
  url: string,
  dockerHostname: string,
): string | undefined {
  try {
    const parsed = new URL(url);
    if (!isLoopbackHostname(parsed.hostname)) {
      return undefined;
    }

    parsed.hostname = dockerHostname;
    return parsed.toString();
  } catch {
    return undefined;
  }
}

export function resolveSupabaseServerUrl(options?: {
  browserUrl?: string;
  internalUrl?: string;
  isRunningInDocker?: boolean;
  dockerHostname?: string;
}): string | undefined {
  const browserUrl = options?.browserUrl ?? getSupabaseBrowserUrl();
  if (!browserUrl) {
    return undefined;
  }

  const isRunningInDocker = options?.isRunningInDocker ?? IS_RUNNING_IN_DOCKER;
  if (!isRunningInDocker) {
    return browserUrl;
  }

  const internalUrl =
    options?.internalUrl ?? getTrimmedServerEnv("SUPABASE_INTERNAL_URL");
  if (internalUrl) {
    return internalUrl;
  }

  return (
    rewriteLoopbackUrlForDocker(
      browserUrl,
      options?.dockerHostname ?? DOCKER_HOSTNAME,
    ) ?? browserUrl
  );
}

export function getSupabaseServerUrl(): string | undefined {
  return resolveSupabaseServerUrl();
}

export function hasSupabaseServerConfig(): boolean {
  return Boolean(getSupabaseServerUrl() && getSupabaseAnonKey());
}
