export const CONNECTION_MODES = ["embedded", "http", "ssh"] as const;

export type ConnectionMode = (typeof CONNECTION_MODES)[number];

export type ConnectionConfig = {
  mode: ConnectionMode;
  url: string;
};

export type ResolveConnectionOptions = {
  defaultEmbeddedUrl?: string;
  urlEnvName?: string;
};

const DEFAULT_EMBEDDED_URL = "http://127.0.0.1:3001";
const DEFAULT_WORKFLOW_EMBEDDED_URL = "http://127.0.0.1:3002";

export function parseConnectionMode(raw: string | undefined): ConnectionMode {
  if (!raw) {
    return "embedded";
  }
  const lowered = raw.toLowerCase();
  if ((CONNECTION_MODES as readonly string[]).includes(lowered)) {
    return lowered as ConnectionMode;
  }
  throw new Error(
    `Invalid SERVER_CONNECTION_MODE="${raw}". Expected one of: ${CONNECTION_MODES.join(", ")}`,
  );
}

export function resolveConnectionConfig(
  env: { mode?: string; url?: string },
  options: ResolveConnectionOptions = {},
): ConnectionConfig {
  const mode = parseConnectionMode(env.mode);
  const defaultUrl = options.defaultEmbeddedUrl ?? DEFAULT_EMBEDDED_URL;
  const urlEnvName = options.urlEnvName ?? "SERVER_CONNECTION_URL";
  if (mode === "embedded") {
    return { mode, url: env.url?.trim() || defaultUrl };
  }
  const url = env.url?.trim();
  if (!url) {
    throw new Error(
      `${urlEnvName} is required when SERVER_CONNECTION_MODE="${mode}".`,
    );
  }
  return { mode, url };
}

/**
 * Resolves the connection config for the workflow runtime (apps/workflow-runtime).
 * Shares SERVER_CONNECTION_MODE with the Bun runtime — runtimes are always
 * reached the same way within a given deployment — but reads its own URL env
 * so embedded/http/ssh targets can differ per runtime.
 */
export function resolveWorkflowConnectionConfig(env: {
  mode?: string;
  url?: string;
}): ConnectionConfig {
  return resolveConnectionConfig(env, {
    defaultEmbeddedUrl: DEFAULT_WORKFLOW_EMBEDDED_URL,
    urlEnvName: "WORKFLOW_CONNECTION_URL",
  });
}
