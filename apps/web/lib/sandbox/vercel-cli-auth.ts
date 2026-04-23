import "server-only";
import type { Sandbox } from "@open-harness/sandbox";
import {
  resolveSandboxHomeDirectory,
  shellEscape,
} from "@/lib/sandbox/home-directory";

const FILE_CLEANUP_TIMEOUT_MS = 5_000;
const VERCEL_CLI_CONFIG_DIRECTORY = ".local/share/com.vercel.cli";

export interface VercelCliAuthConfig {
  token: string;
  expiresAt: number;
}

export interface VercelCliSandboxSetup {
  auth: VercelCliAuthConfig | null;
}

async function removeFileIfPresent(
  sandbox: Sandbox,
  filePath: string,
): Promise<void> {
  const result = await sandbox.exec(
    `rm -f ${shellEscape(filePath)}`,
    sandbox.workingDirectory,
    FILE_CLEANUP_TIMEOUT_MS,
  );

  if (!result.success) {
    throw new Error(
      `Failed to remove ${filePath}: ${result.stderr || result.stdout || "unknown error"}`,
    );
  }
}

export async function getVercelCliSandboxSetup(_params: {
  userId: string;
  sessionRecord: unknown;
}): Promise<VercelCliSandboxSetup> {
  return {
    auth: null,
  };
}

export async function syncVercelCliAuthToSandbox(params: {
  sandbox: Sandbox;
  setup: VercelCliSandboxSetup;
}): Promise<void> {
  const { sandbox, setup } = params;
  const homeDirectory = await resolveSandboxHomeDirectory(sandbox);
  const authConfigPath = `${homeDirectory}/${VERCEL_CLI_CONFIG_DIRECTORY}/auth.json`;

  if (setup.auth) {
    await sandbox.writeFile(
      authConfigPath,
      `${JSON.stringify(setup.auth, null, 2)}\n`,
      "utf-8",
    );
  } else {
    await removeFileIfPresent(sandbox, authConfigPath);
  }
}
