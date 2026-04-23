export const CONNECTION_MODES = ["embedded", "http", "ssh"] as const;

export type ConnectionMode = (typeof CONNECTION_MODES)[number];

export type ConnectionConfig = {
  mode: ConnectionMode;
  url: string;
};

const DEFAULT_EMBEDDED_URL = "http://127.0.0.1:3001";

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

export function resolveConnectionConfig(env: {
  mode?: string;
  url?: string;
}): ConnectionConfig {
  const mode = parseConnectionMode(env.mode);
  if (mode === "embedded") {
    return { mode, url: env.url?.trim() || DEFAULT_EMBEDDED_URL };
  }
  const url = env.url?.trim();
  if (!url) {
    throw new Error(
      `SERVER_CONNECTION_URL is required when SERVER_CONNECTION_MODE="${mode}".`,
    );
  }
  return { mode, url };
}
