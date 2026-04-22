import { type ChildProcess, spawn } from "node:child_process";

export type SshTunnelOptions = {
  target: string;
  remoteHost?: string;
  remotePort: number;
  localHost?: string;
  localPort: number;
  extraArgs?: string[];
};

export type SshTunnelHandle = {
  localUrl: string;
  close: () => Promise<void>;
  healthcheck: () => Promise<boolean>;
};

export async function openSshTunnel(
  options: SshTunnelOptions,
): Promise<SshTunnelHandle> {
  const {
    target,
    remoteHost = "127.0.0.1",
    remotePort,
    localHost = "127.0.0.1",
    localPort,
    extraArgs = [],
  } = options;

  const args = [
    "-N",
    "-T",
    "-o",
    "ExitOnForwardFailure=yes",
    "-o",
    "ServerAliveInterval=30",
    "-L",
    `${localHost}:${localPort}:${remoteHost}:${remotePort}`,
    ...extraArgs,
    target,
  ];

  let child: ChildProcess;
  try {
    child = spawn("ssh", args, { stdio: ["ignore", "pipe", "pipe"] });
  } catch (err) {
    throw new Error(
      `Failed to spawn ssh. Is the ssh binary available on PATH? ${(err as Error).message}`,
      { cause: err },
    );
  }

  child.stderr?.on("data", (buf: Buffer) => {
    process.stderr.write(`[ssh-tunnel] ${buf.toString()}`);
  });

  const localUrl = `http://${localHost}:${localPort}`;

  // NOTE(Phase 1): lifecycle is wired but tunnel readiness detection and retry
  // logic are deliberately minimal. Phase 2 will add exponential backoff,
  // known_hosts handling, and user-visible failure states (FR-17, FR-19).
  await new Promise((resolve) => setTimeout(resolve, 500));

  const close = async (): Promise<void> => {
    if (child.exitCode !== null) {
      return;
    }
    child.kill("SIGTERM");
    await new Promise<void>((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) {
          return;
        }
        settled = true;
        resolve();
      };
      const timer = setTimeout(() => {
        child.kill("SIGKILL");
        finish();
      }, 3000);
      child.once("exit", () => {
        clearTimeout(timer);
        finish();
      });
    });
  };

  const healthcheck = async (): Promise<boolean> => {
    if (child.exitCode !== null) {
      return false;
    }
    try {
      const res = await fetch(`${localUrl}/v1/health`);
      return res.ok;
    } catch {
      return false;
    }
  };

  return { localUrl, close, healthcheck };
}
