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

  const child: ChildProcess = spawn("ssh", args, {
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.stderr?.on("data", (buf: Buffer) => {
    process.stderr.write(`[ssh-tunnel] ${buf.toString()}`);
  });

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

  return { localUrl: `http://${localHost}:${localPort}`, close };
}
