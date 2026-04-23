import { type ChildProcess, spawn } from "node:child_process";
import { logger } from "./logger.js";

export type ManagedProcessOptions = {
  label: string;
  command: string;
  args: string[];
  cwd: string;
  env?: NodeJS.ProcessEnv;
};

export class ManagedProcess {
  private readonly options: ManagedProcessOptions;
  private child: ChildProcess | undefined;
  private exitPromise: Promise<number | null> | undefined;

  constructor(options: ManagedProcessOptions) {
    this.options = options;
  }

  start(): void {
    if (this.child) {
      return;
    }
    const { label, command, args, cwd, env } = this.options;
    logger.info(`[${label}] spawning: ${command} ${args.join(" ")}`);
    this.child = spawn(command, args, {
      cwd,
      env: { ...process.env, ...env },
      stdio: ["ignore", "pipe", "pipe"],
    });
    this.child.stdout?.on("data", (buf: Buffer) => {
      process.stdout.write(`[${label}] ${buf.toString()}`);
    });
    this.child.stderr?.on("data", (buf: Buffer) => {
      process.stderr.write(`[${label}] ${buf.toString()}`);
    });
    this.exitPromise = new Promise((resolve) => {
      this.child?.on("exit", (code) => {
        logger.info(`[${label}] exited with code ${code}`);
        resolve(code);
      });
    });
  }

  async stop(
    signal: NodeJS.Signals = "SIGTERM",
    graceMs = 5000,
  ): Promise<void> {
    if (!this.child || this.child.exitCode !== null) {
      return;
    }
    this.child.kill(signal);
    await Promise.race([
      this.exitPromise,
      new Promise<void>((resolve) => setTimeout(resolve, graceMs)),
    ]);
    if (this.child.exitCode === null) {
      this.child.kill("SIGKILL");
    }
  }

  get pid(): number | undefined {
    return this.child?.pid;
  }

  get isRunning(): boolean {
    return this.child !== undefined && this.child.exitCode === null;
  }
}
