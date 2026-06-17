import { beforeEach, describe, expect, mock, test } from "bun:test";

const generateTextCalls: Array<{ prompt: string }> = [];
let generateTextResult: { text: string } | Error = {
  text: "Generated session title",
};

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

const handlerModulePromise = import("./generate-title.ts");

function createJsonRequest(body: unknown): Request {
  return new Request("http://runtime/v1/generate-title", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("handleGenerateTitle", () => {
  beforeEach(() => {
    generateTextResult = { text: "Generated session title" };
    generateTextCalls.length = 0;
  });

  test("returns 400 for invalid JSON", async () => {
    const { handleGenerateTitle } = await handlerModulePromise;
    const res = await handleGenerateTitle(
      new Request("http://runtime/v1/generate-title", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{",
      }),
    );
    const body = (await res.json()) as { error: string };
    expect(res.status).toBe(400);
    expect(body.error).toBe("Invalid JSON body");
  });

  test("returns 400 when message is missing or blank", async () => {
    const { handleGenerateTitle } = await handlerModulePromise;

    const missing = await handleGenerateTitle(createJsonRequest({}));
    expect(missing.status).toBe(400);
    expect(((await missing.json()) as { error: string }).error).toBe(
      "Missing required field: message",
    );

    const blank = await handleGenerateTitle(
      createJsonRequest({ message: "   " }),
    );
    expect(blank.status).toBe(400);
    expect(((await blank.json()) as { error: string }).error).toBe(
      "Missing required field: message",
    );
  });

  test("returns generated title and trims to first non-empty line", async () => {
    generateTextResult = { text: "  Fix API Validation\nIgnore this line" };

    const { handleGenerateTitle } = await handlerModulePromise;
    const res = await handleGenerateTitle(
      createJsonRequest({ message: "  hello world  " }),
    );
    const body = (await res.json()) as { title: string };
    expect(res.status).toBe(200);
    expect(body.title).toBe("Fix API Validation");
    expect(generateTextCalls).toHaveLength(1);
    expect(generateTextCalls[0]?.prompt).toContain("hello world");
  });

  test("returns 500 when title generation throws", async () => {
    generateTextResult = new Error("upstream failed");

    const { handleGenerateTitle } = await handlerModulePromise;
    const res = await handleGenerateTitle(
      createJsonRequest({ message: "hello" }),
    );
    const body = (await res.json()) as { error: string };
    expect(res.status).toBe(500);
    expect(body.error).toBe("Failed to generate title");
  });
});
