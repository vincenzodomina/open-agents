import { beforeEach, describe, expect, mock, test } from "bun:test";
import type { Sandbox } from "@open-harness/sandbox";

mock.module("server-only", () => ({}));

const vercelCliAuthModulePromise = import("./vercel-cli-auth");

function createSandbox() {
  const writeFileCalls: Array<{ path: string; content: string }> = [];
  const execCalls: Array<{ command: string; cwd: string; timeoutMs: number }> =
    [];

  const sandbox: Sandbox = {
    type: "cloud",
    workingDirectory: "/workspace",
    exec: async (command, cwd, timeoutMs) => {
      execCalls.push({ command, cwd, timeoutMs });
      if (command === 'printf %s "$HOME"') {
        return {
          success: true,
          exitCode: 0,
          stdout: "/home/tester",
          stderr: "",
          truncated: false,
        };
      }

      return {
        success: true,
        exitCode: 0,
        stdout: "",
        stderr: "",
        truncated: false,
      };
    },
    writeFile: async (path, content) => {
      writeFileCalls.push({ path, content });
    },
    readFile: async () => {
      throw new Error("not implemented");
    },
    stat: async () => {
      throw new Error("not implemented");
    },
    access: async () => {
      throw new Error("not implemented");
    },
    mkdir: async () => {
      throw new Error("not implemented");
    },
    readdir: async () => {
      throw new Error("not implemented");
    },
    stop: async () => {},
  };

  return {
    sandbox,
    writeFileCalls,
    execCalls,
  };
}

describe("vercel-cli-auth", () => {
  beforeEach(() => {});

  test("does not provision Vercel CLI auth from the session", async () => {
    const { getVercelCliSandboxSetup } = await vercelCliAuthModulePromise;

    const setup = await getVercelCliSandboxSetup({
      userId: "user-1",
      sessionRecord: {
        id: "sess-1",
      },
    });

    expect(setup).toEqual({ auth: null });
  });

  test("removes stale CLI auth when no auth is available", async () => {
    const { getVercelCliSandboxSetup, syncVercelCliAuthToSandbox } =
      await vercelCliAuthModulePromise;
    const { sandbox, writeFileCalls, execCalls } = createSandbox();

    const setup = await getVercelCliSandboxSetup({
      userId: "user-1",
      sessionRecord: {},
    });

    await syncVercelCliAuthToSandbox({ sandbox, setup });

    expect(writeFileCalls).toEqual([]);
    expect(execCalls).toEqual([
      {
        command: 'printf %s "$HOME"',
        cwd: "/workspace",
        timeoutMs: 5000,
      },
      {
        command: "rm -f '/home/tester/.local/share/com.vercel.cli/auth.json'",
        cwd: "/workspace",
        timeoutMs: 5000,
      },
    ]);
  });
});
