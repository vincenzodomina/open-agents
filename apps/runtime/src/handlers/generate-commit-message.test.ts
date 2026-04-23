import { beforeEach, describe, expect, mock, test } from "bun:test";

let diffStdout = "";
const generateTextCalls: Array<{ prompt: string }> = [];
let generateTextResult: { text: string } | Error = { text: "feat: add thing" };
const connectSandboxCalls: Array<unknown> = [];

mock.module("@open-harness/agent", () => ({
  gateway: (modelId: string) => ({ modelId }),
}));

mock.module("ai", () => ({
  generateText: async (input: { prompt: string }) => {
    generateTextCalls.push(input);
    if (generateTextResult instanceof Error) {
      throw generateTextResult;
    }
    return generateTextResult;
  },
}));

mock.module("@open-harness/sandbox", () => ({
  connectSandbox: async (state: unknown) => {
    connectSandboxCalls.push(state);
    return {
      workingDirectory: "/work",
      exec: async () => ({
        stdout: diffStdout,
        stderr: "",
        success: true,
        exitCode: 0,
      }),
    };
  },
}));

const handlerModulePromise = import("./generate-commit-message.ts");

function createRequest(body: unknown): Request {
  return new Request("http://runtime/v1/generate-commit-message", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("handleGenerateCommitMessage", () => {
  beforeEach(() => {
    diffStdout = "";
    generateTextResult = { text: "feat: add thing" };
    generateTextCalls.length = 0;
    connectSandboxCalls.length = 0;
  });

  test("returns 400 for invalid JSON", async () => {
    const { handleGenerateCommitMessage } = await handlerModulePromise;
    const res = await handleGenerateCommitMessage(
      new Request("http://runtime/v1/generate-commit-message", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{",
      }),
    );
    expect(res.status).toBe(400);
    expect(((await res.json()) as { error: string }).error).toBe(
      "Invalid JSON body",
    );
  });

  test("returns 400 when sandboxState is missing", async () => {
    const { handleGenerateCommitMessage } = await handlerModulePromise;
    const res = await handleGenerateCommitMessage(createRequest({}));
    expect(res.status).toBe(400);
    expect(((await res.json()) as { error: string }).error).toBe(
      "Missing required field: sandboxState",
    );
  });

  test("returns fallback message when diff is empty", async () => {
    diffStdout = "";
    const { handleGenerateCommitMessage } = await handlerModulePromise;
    const res = await handleGenerateCommitMessage(
      createRequest({ sandboxState: { type: "just-bash" }, sessionTitle: "T" }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { message: string };
    expect(body.message).toBe("chore: update repository changes");
    expect(generateTextCalls).toHaveLength(0);
  });

  test("returns generated commit message from diff", async () => {
    diffStdout = " 1 file changed\n---DIFF---\n+new line\n";
    generateTextResult = { text: "feat: add new line\nignored" };
    const { handleGenerateCommitMessage } = await handlerModulePromise;
    const res = await handleGenerateCommitMessage(
      createRequest({
        sandboxState: { type: "just-bash" },
        sessionTitle: "T",
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { message: string };
    expect(body.message).toBe("feat: add new line");
    expect(connectSandboxCalls).toHaveLength(1);
    expect(generateTextCalls[0]?.prompt).toContain("new line");
  });

  test("falls back on LLM failure", async () => {
    diffStdout = " 1 file changed\n---DIFF---\n+x\n";
    generateTextResult = new Error("upstream failed");
    const { handleGenerateCommitMessage } = await handlerModulePromise;
    const res = await handleGenerateCommitMessage(
      createRequest({ sandboxState: { type: "just-bash" }, sessionTitle: "T" }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { message: string };
    expect(body.message).toBe("chore: update repository changes");
  });
});
