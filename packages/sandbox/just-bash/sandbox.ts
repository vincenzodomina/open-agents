import type { Dirent } from "node:fs";
import { randomBytes } from "node:crypto";

import {
  InMemoryFs,
  MountableFs,
  ReadWriteFs,
  Sandbox as JbSandbox,
} from "just-bash";
import type {
  IFileSystem,
  NetworkConfig,
  SandboxCommandFinished,
} from "just-bash";

import type {
  ExecResult,
  Sandbox,
  SandboxHooks,
  SandboxStats,
} from "../interface";
import {
  allocateWorkspaceDirectory,
  JUST_BASH_WORKING_DIRECTORY,
} from "./bootstrap";
import {
  commandInvokesGit,
  execJustBashGitLine,
  parseCdSegment,
  resolveVirtualPath,
  splitShellChain,
  stripEnvPrefix,
} from "./git-cli";
import { bootstrapJustBashGitWorkspace } from "./git-workspace";
import {
  registerActiveJustBashSandbox,
  setDormantWorkspaceRoot,
  unregisterActiveJustBashSandbox,
} from "./registry";

const MAX_OUTPUT_LENGTH = 50_000;
const TIMEOUT_BUFFER_MS = 30_000;
const DEFAULT_DETACHED_GIT_TIMEOUT_MS = 300_000;
const DETACHED_QUICK_FAILURE_WINDOW_MS = 2_000;

type JbSandboxInstance = Awaited<ReturnType<typeof JbSandbox.create>>;

function getNetworkConfig(): NetworkConfig | undefined {
  if (process.env["JUST_BASH_NETWORK"] === "all") {
    return { dangerouslyAllowFullInternetAccess: true };
  }
  return undefined;
}

function diskBackedWorkspaceMount(workspaceRoot: string): IFileSystem {
  return new MountableFs({
    base: new InMemoryFs(),
    mounts: [
      {
        mountPoint: JUST_BASH_WORKING_DIRECTORY,
        filesystem: new ReadWriteFs({ root: workspaceRoot }),
      },
    ],
  });
}

export interface JustBashCreateConfig {
  name?: string;
  source?: {
    url: string;
    branch?: string;
    token?: string;
    newBranch?: string;
  };
  env?: Record<string, string>;
  githubToken?: string;
  gitUser?: { name: string; email: string };
  hooks?: SandboxHooks;
  timeout?: number | null;
  ports?: number[];
  baseSnapshotId?: string;
  restoreSnapshotId?: string;
  skipGitWorkspaceBootstrap?: boolean;
}

/**
 * In-process {@link Sandbox} backed by [just-bash](https://github.com/vercel-labs/just-bash)
 * (virtual shell + mounted workspace). For local exploration; not a replacement for Vercel
 * Sandboxes in production.
 */
export class JustBashSandbox implements Sandbox {
  readonly type = "cloud" as const;
  readonly name: string;
  readonly id: string;
  readonly workingDirectory = JUST_BASH_WORKING_DIRECTORY;
  readonly env?: Record<string, string>;
  readonly currentBranch?: string;
  readonly hooks?: SandboxHooks;
  private readonly inner: JbSandboxInstance;
  private readonly rootPath: string;
  private readonly vfs: IFileSystem;
  private readonly githubToken?: string;
  private readonly _ports: number[];
  private isStopped = false;
  private _expiresAt?: number;
  private _timeout?: number;
  private timeoutTimer?: ReturnType<typeof setTimeout>;

  get expiresAt(): number | undefined {
    return this._expiresAt;
  }

  get timeout(): number | undefined {
    return this._timeout;
  }

  get host(): string | undefined {
    return undefined;
  }

  get environmentDetails(): string {
    return `- This environment uses just-bash (simulated shell, in-process). Git is provided by isomorphic-git against the virtual workspace (no host \`git\` binary). It is not a full Linux VM.
- There is no real Node/bun binary in the emulated shell: \`npm\`, \`bun\`, and \`node\` will not work as on Vercel Sandboxes unless you add a custom command in just-bash.
- No shareable preview URLs: \`domain(port)\` is a placeholder; start a real dev server only if you run it on the host, not via this tool.
- Network in emulated \`curl\` is off unless you set \`JUST_BASH_NETWORK=all\` in the server environment.
- Use workspace-relative paths; the working directory is ${JUST_BASH_WORKING_DIRECTORY} and should not be prefixed on every command.`;
  }

  private constructor(
    inner: JbSandboxInstance,
    options: {
      name: string;
      id: string;
      rootPath: string;
      env?: Record<string, string>;
      currentBranch?: string;
      hooks?: SandboxHooks;
      timeout?: number | null;
      startTime?: number;
      ports: number[];
      vfs: IFileSystem;
      githubToken?: string;
    },
  ) {
    this.inner = inner;
    this.name = options.name;
    this.id = options.id;
    this.env = options.env;
    this.currentBranch = options.currentBranch;
    this.hooks = options.hooks;
    this.rootPath = options.rootPath;
    this.vfs = options.vfs;
    this.githubToken = options.githubToken;
    this._ports = options.ports;

    if (options.timeout != null && options.startTime !== undefined) {
      this._timeout = options.timeout;
      this._expiresAt = options.startTime + options.timeout;
      this.scheduleProactiveStop();
    }
  }

  private getRuntimePreviewEnv(): Record<string, string> {
    const runtimeEnv: Record<string, string> = {};
    for (const port of this._ports) {
      runtimeEnv[`SANDBOX_URL_${port}`] = `http://127.0.0.1:${port}`;
    }
    return runtimeEnv;
  }

  private getCommandEnv(): Record<string, string> | undefined {
    const preview = this.getRuntimePreviewEnv();
    if (!this.env && Object.keys(preview).length === 0) {
      return undefined;
    }
    return { ...this.env, ...preview };
  }

  private scheduleProactiveStop(): void {
    if (this._expiresAt === undefined) {
      return;
    }
    const msUntilTimeout = this._expiresAt - Date.now();
    if (msUntilTimeout <= 0) {
      return;
    }

    this.timeoutTimer = setTimeout(async () => {
      try {
        if (this.isStopped) {
          return;
        }
        if (this.hooks?.onTimeout) {
          try {
            await this.hooks.onTimeout(this);
          } catch (error) {
            console.error(
              "[JustBashSandbox] onTimeout hook failed:",
              error instanceof Error ? error.message : error,
            );
          }
        }
      } catch (error) {
        console.warn(
          "[JustBashSandbox] onTimeout handler failed:",
          error instanceof Error ? error.message : error,
        );
      }
    }, msUntilTimeout);
  }

  private rescheduleProactiveStop(): void {
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
      this.timeoutTimer = undefined;
    }
    this.scheduleProactiveStop();
  }

  /**
   * Builds the workspace filesystem, bootstraps git via isomorphic-git when needed, mounts at
   * {@link JUST_BASH_WORKING_DIRECTORY}, then starts just-bash.
   */
  static async create(
    config: JustBashCreateConfig = {},
  ): Promise<JustBashSandbox> {
    const {
      name,
      source,
      env,
      githubToken,
      gitUser,
      hooks,
      timeout,
      ports = [],
      baseSnapshotId,
      restoreSnapshotId,
      skipGitWorkspaceBootstrap = false,
    } = config;

    if (baseSnapshotId !== undefined || restoreSnapshotId !== undefined) {
      console.warn(
        "[JustBashSandbox] Ignoring snapshot/base fields (just-bash has no VM snapshots)",
      );
    }

    const stableName = name ?? `jb-${randomBytes(8).toString("hex")}`;
    const workspacePath = await allocateWorkspaceDirectory(stableName);

    const vfs = diskBackedWorkspaceMount(workspacePath);

    const bootstrap = await bootstrapJustBashGitWorkspace({
      vfs,
      ...(source !== undefined && {
        source: {
          repo: source.url,
          branch: source.branch,
          token: source.token,
          newBranch: source.newBranch,
        },
      }),
      gitUser,
      githubToken,
      skipGitWorkspaceBootstrap,
    });

    const effectiveTimeout = timeout ?? undefined;
    const inner = await JbSandbox.create({
      fs: vfs,
      cwd: JUST_BASH_WORKING_DIRECTORY,
      env,
      ...(effectiveTimeout !== undefined
        ? { timeoutMs: effectiveTimeout + TIMEOUT_BUFFER_MS }
        : {}),
      network: getNetworkConfig(),
    });

    const id = stableName;
    const startTime = Date.now();

    const sandbox = new JustBashSandbox(inner, {
      name: stableName,
      id,
      rootPath: workspacePath,
      vfs,
      githubToken,
      env,
      currentBranch: bootstrap.currentBranch,
      hooks,
      timeout: effectiveTimeout,
      startTime,
      ports,
    });

    registerActiveJustBashSandbox(stableName, sandbox);

    if (hooks?.afterStart) {
      await hooks.afterStart(sandbox);
    }

    return sandbox;
  }

  /** Re-attaches just-bash to an on-disk workspace after {@link JustBashSandbox.stop}. */
  static async reopen(params: {
    name: string;
    rootPath: string;
    env?: Record<string, string>;
    githubToken?: string;
    hooks?: SandboxHooks;
    timeout?: number;
    ports?: number[];
    currentBranch?: string;
  }): Promise<JustBashSandbox> {
    const {
      name,
      rootPath,
      env,
      githubToken,
      hooks,
      timeout,
      ports = [],
      currentBranch,
    } = params;

    const vfs = diskBackedWorkspaceMount(rootPath);
    const effectiveTimeout = timeout ?? undefined;

    const inner = await JbSandbox.create({
      fs: vfs,
      cwd: JUST_BASH_WORKING_DIRECTORY,
      env,
      ...(effectiveTimeout !== undefined
        ? { timeoutMs: effectiveTimeout + TIMEOUT_BUFFER_MS }
        : {}),
      network: getNetworkConfig(),
    });

    const sandbox = new JustBashSandbox(inner, {
      name,
      id: name,
      rootPath,
      vfs,
      githubToken,
      env,
      currentBranch,
      hooks,
      timeout: effectiveTimeout,
      startTime: Date.now(),
      ports,
    });

    registerActiveJustBashSandbox(name, sandbox);

    if (hooks?.afterStart) {
      await hooks.afterStart(sandbox);
    }

    return sandbox;
  }

  domain(port: number): string {
    return `http://127.0.0.1:${port}`;
  }

  async extendTimeout(additionalMs: number): Promise<{ expiresAt: number }> {
    if (this.isStopped) {
      throw new Error("Cannot extend timeout on stopped sandbox");
    }
    if (this._expiresAt === undefined) {
      throw new Error("Timeout tracking not enabled for this sandbox");
    }

    await this.inner.extendTimeout(additionalMs);
    this._expiresAt += additionalMs;
    this.rescheduleProactiveStop();

    if (this.hooks?.onTimeoutExtended) {
      try {
        await this.hooks.onTimeoutExtended(this, additionalMs);
      } catch (error) {
        console.error(
          "[JustBashSandbox] onTimeoutExtended hook failed:",
          error instanceof Error ? error.message : error,
        );
      }
    }

    return { expiresAt: this._expiresAt };
  }

  async readFile(filePath: string, _encoding: "utf-8"): Promise<string> {
    return this.inner.readFile(filePath, "utf-8");
  }

  async writeFile(
    filePath: string,
    content: string,
    _encoding: "utf-8",
  ): Promise<void> {
    const parentDir = filePath.substring(0, filePath.lastIndexOf("/"));
    if (parentDir) {
      await this.mkdir(parentDir, { recursive: true });
    }
    await this.inner.writeFiles({
      [filePath]: content,
    });
  }

  async stat(filePath: string): Promise<SandboxStats> {
    const result = await this.inner.runCommand({
      cmd: "stat",
      args: ["-c", "%F\t%s\t%Y", filePath],
      cwd: JUST_BASH_WORKING_DIRECTORY,
      env: this.getCommandEnv(),
    });

    if (result.exitCode !== 0) {
      throw new Error(`ENOENT: no such file or directory, stat '${filePath}'`);
    }

    const output = (await result.stdout()).trim();
    const [fileType, sizeStr, mtimeStr] = output.split("\t");

    const isDir = fileType === "directory";
    const size = Number.parseInt(sizeStr ?? "0", 10);
    const mtimeMs = Number.parseInt(mtimeStr ?? "0", 10) * 1000;

    return {
      isDirectory: () => isDir,
      isFile: () => !isDir,
      size,
      mtimeMs,
    };
  }

  async access(filePath: string): Promise<void> {
    const result = await this.inner.runCommand({
      cmd: "test",
      args: ["-e", filePath],
      cwd: JUST_BASH_WORKING_DIRECTORY,
      env: this.getCommandEnv(),
    });

    if (result.exitCode !== 0) {
      throw new Error(
        `ENOENT: no such file or directory, access '${filePath}'`,
      );
    }
  }

  async mkdir(
    dirPath: string,
    options?: { recursive?: boolean },
  ): Promise<void> {
    await this.inner.mkDir(dirPath, { recursive: options?.recursive });
  }

  async readdir(
    dirPath: string,
    _options: { withFileTypes: true },
  ): Promise<Dirent[]> {
    const result = await this.inner.runCommand({
      cmd: "bash",
      args: ["-c", `ls -A1F "${dirPath}" 2>/dev/null || true`],
      cwd: JUST_BASH_WORKING_DIRECTORY,
      env: this.getCommandEnv(),
    });

    if (result.exitCode !== 0) {
      throw new Error(
        `ENOENT: no such file or directory, scandir '${dirPath}'`,
      );
    }

    const raw = (await result.stdout()).trim();
    if (raw === "") {
      return [];
    }

    return raw.split("\n").map((line: string): Dirent => {
      let name = line;
      let isDir = false;
      let isSymlink = false;
      if (line.endsWith("/")) {
        isDir = true;
        name = line.slice(0, -1);
      } else if (line.endsWith("@")) {
        isSymlink = true;
        name = line.slice(0, -1);
      } else if (
        line.endsWith("*") ||
        line.endsWith("=") ||
        line.endsWith("|")
      ) {
        name = line.slice(0, -1);
      }

      return {
        name,
        parentPath: dirPath,
        path: dirPath,
        isDirectory: () => isDir,
        isFile: () => !isDir && !isSymlink,
        isSymbolicLink: () => isSymlink,
        isBlockDevice: () => false,
        isCharacterDevice: () => false,
        isFIFO: () => false,
        isSocket: () => false,
      } as Dirent;
    });
  }

  private truncateOutput(text: string): { text: string; truncated: boolean } {
    if (text.length <= MAX_OUTPUT_LENGTH) {
      return { text, truncated: false };
    }
    return { text: text.slice(0, MAX_OUTPUT_LENGTH), truncated: true };
  }

  /**
   * Runs `git` via isomorphic-git (and optional `&&` chains with `cd` / bash segments).
   * Returns `undefined` when the command does not involve git.
   */
  private async tryExecGitChain(
    command: string,
    initialCwd: string,
    timeoutMs: number,
    options?: { signal?: AbortSignal },
  ): Promise<ExecResult | undefined> {
    if (!commandInvokesGit(command)) {
      return undefined;
    }

    const segments = splitShellChain(command);
    let virtualCwd = initialCwd;

    const timeoutSignal = AbortSignal.timeout(timeoutMs);
    const signal =
      options?.signal !== undefined
        ? AbortSignal.any([timeoutSignal, options.signal])
        : timeoutSignal;

    let accOut = "";
    let accErr = "";
    let exitCode = 0;

    for (const segment of segments) {
      const cdArg = parseCdSegment(segment);
      if (cdArg !== null) {
        virtualCwd = resolveVirtualPath(virtualCwd, cdArg);
        continue;
      }

      const trimmed = stripEnvPrefix(segment);
      if (trimmed.startsWith("git")) {
        const raw = await execJustBashGitLine(segment, this.vfs, virtualCwd, {
          githubToken: this.githubToken,
          signal,
        });
        accOut += raw.stdout;
        accErr += raw.stderr;
        exitCode = raw.exitCode;
        if (raw.exitCode !== 0) {
          const o = this.truncateOutput(accOut);
          const e = this.truncateOutput(accErr);
          return {
            success: false,
            exitCode,
            stdout: o.text,
            stderr: e.text,
            truncated: o.truncated || e.truncated,
          };
        }
        continue;
      }

      try {
        const result = await this.inner.runCommand({
          cmd: "bash",
          args: ["-c", segment],
          cwd: virtualCwd,
          env: this.getCommandEnv(),
          signal,
        });
        const so = await result.stdout();
        const se = (await result.stderr()) ?? "";
        accOut += so;
        accErr += se;
        exitCode = result.exitCode;
        if (result.exitCode !== 0) {
          const o = this.truncateOutput(accOut);
          const e = this.truncateOutput(accErr);
          return {
            success: false,
            exitCode,
            stdout: o.text,
            stderr: e.text,
            truncated: o.truncated || e.truncated,
          };
        }
      } catch (error) {
        if (error instanceof Error && error.name === "TimeoutError") {
          return {
            success: false,
            exitCode: null,
            stdout: "",
            stderr: `Command timed out after ${timeoutMs}ms`,
            truncated: false,
          };
        }
        if (error instanceof Error && error.name === "AbortError") {
          throw error;
        }
        return {
          success: false,
          exitCode: null,
          stdout: "",
          stderr: error instanceof Error ? error.message : String(error),
          truncated: false,
        };
      }
    }

    const o = this.truncateOutput(accOut);
    const e = this.truncateOutput(accErr);
    return {
      success: exitCode === 0,
      exitCode,
      stdout: o.text,
      stderr: e.text,
      truncated: o.truncated || e.truncated,
    };
  }

  async exec(
    command: string,
    cwd: string,
    timeoutMs: number,
    options?: { signal?: AbortSignal },
  ): Promise<ExecResult> {
    try {
      const gitChain = await this.tryExecGitChain(
        command,
        cwd,
        timeoutMs,
        options,
      );
      if (gitChain !== undefined) {
        return gitChain;
      }

      const timeoutSignal = AbortSignal.timeout(timeoutMs);
      const signal = options?.signal
        ? AbortSignal.any([timeoutSignal, options.signal])
        : timeoutSignal;

      const result = await this.inner.runCommand({
        cmd: "bash",
        args: ["-c", command],
        cwd,
        env: this.getCommandEnv(),
        signal,
      });

      let stdout = await result.stdout();
      let truncated = false;
      if (stdout.length > MAX_OUTPUT_LENGTH) {
        stdout = stdout.slice(0, MAX_OUTPUT_LENGTH);
        truncated = true;
      }

      return {
        success: result.exitCode === 0,
        exitCode: result.exitCode,
        stdout,
        stderr: (await result.stderr()) ?? "",
        truncated,
      };
    } catch (error) {
      if (error instanceof Error && error.name === "TimeoutError") {
        return {
          success: false,
          exitCode: null,
          stdout: "",
          stderr: `Command timed out after ${timeoutMs}ms`,
          truncated: false,
        };
      }
      if (error instanceof Error && error.name === "AbortError") {
        throw error;
      }
      return {
        success: false,
        exitCode: null,
        stdout: "",
        stderr: error instanceof Error ? error.message : String(error),
        truncated: false,
      };
    }
  }

  async execDetached(
    command: string,
    cwd: string,
  ): Promise<{ commandId: string }> {
    if (commandInvokesGit(command)) {
      const finished = await this.tryExecGitChain(
        command,
        cwd,
        DEFAULT_DETACHED_GIT_TIMEOUT_MS,
      );
      if (finished === undefined) {
        throw new Error("just-bash: internal error (git chain handler)");
      }
      if (!finished.success) {
        throw new Error(
          `Background command exited with code ${String(finished.exitCode)}. stderr:\n${finished.stderr.trim() || "<no stderr>"}`,
        );
      }
      return { commandId: `jb-git-${Date.now().toString(36)}` };
    }

    const cmd = await this.inner.runCommand({
      cmd: "bash",
      args: ["-c", command],
      cwd,
      env: this.getCommandEnv(),
      detached: true,
    });

    const timeoutProbe = new Promise<{ kind: "timeout" }>((resolve) => {
      setTimeout(
        () => resolve({ kind: "timeout" }),
        DETACHED_QUICK_FAILURE_WINDOW_MS,
      );
    });

    const outcome = await Promise.race([
      cmd.wait().then((finished: SandboxCommandFinished) => ({
        kind: "finished" as const,
        finished,
      })),
      timeoutProbe,
    ]);

    if (outcome.kind === "timeout") {
      return { commandId: cmd.cmdId };
    }

    if (outcome.finished.exitCode !== 0) {
      const stderr = await outcome.finished.stderr();
      throw new Error(
        `Background command exited with code ${outcome.finished.exitCode}. stderr:\n${stderr.trim() || "<no stderr>"}`,
      );
    }
    return { commandId: cmd.cmdId };
  }

  async stop(): Promise<void> {
    if (this.isStopped) {
      return;
    }
    this.isStopped = true;
    this._expiresAt = undefined;
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
      this.timeoutTimer = undefined;
    }

    if (this.hooks?.beforeStop) {
      try {
        await this.hooks.beforeStop(this);
      } catch (error) {
        console.error(
          "[JustBashSandbox] beforeStop hook failed:",
          error instanceof Error ? error.message : error,
        );
      }
    }

    await this.inner.stop();
    unregisterActiveJustBashSandbox(this.name);
    setDormantWorkspaceRoot(this.name, this.rootPath);
  }

  getState(): {
    type: "just-bash";
    sandboxName: string;
    runtimeState: "active";
    expiresAt?: number;
  } {
    return {
      type: "just-bash",
      sandboxName: this.name,
      runtimeState: "active",
      ...(this._expiresAt !== undefined ? { expiresAt: this._expiresAt } : {}),
    };
  }
}
