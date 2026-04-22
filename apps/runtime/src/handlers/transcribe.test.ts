import { beforeEach, describe, expect, mock, test } from "bun:test";

const transcribeCalls: Array<{ audio: string }> = [];
let transcribeResult: { text: string } | Error = { text: "hello there" };

mock.module("@ai-sdk/elevenlabs", () => ({
  elevenlabs: {
    transcription: (modelId: string) => ({ modelId }),
  },
}));

mock.module("ai", () => ({
  experimental_transcribe: async (input: { audio: string }) => {
    transcribeCalls.push({ audio: input.audio });
    if (transcribeResult instanceof Error) {
      throw transcribeResult;
    }
    return transcribeResult;
  },
}));

const handlerModulePromise = import("./transcribe.ts");

function createRequest(body: unknown): Request {
  return new Request("http://runtime/v1/transcribe", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("handleTranscribe", () => {
  beforeEach(() => {
    transcribeResult = { text: "hello there" };
    transcribeCalls.length = 0;
  });

  test("returns 400 for invalid JSON", async () => {
    const { handleTranscribe } = await handlerModulePromise;
    const res = await handleTranscribe(
      new Request("http://runtime/v1/transcribe", {
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

  test("returns 400 when audio is missing", async () => {
    const { handleTranscribe } = await handlerModulePromise;
    const res = await handleTranscribe(createRequest({}));
    expect(res.status).toBe(400);
    expect(((await res.json()) as { error: string }).error).toBe(
      "Missing required field: audio",
    );
  });

  test("returns 413 when audio exceeds size limit", async () => {
    const { handleTranscribe } = await handlerModulePromise;
    const oversized = "x".repeat(10 * 1024 * 1024 + 1);
    const res = await handleTranscribe(createRequest({ audio: oversized }));
    expect(res.status).toBe(413);
    expect(transcribeCalls).toHaveLength(0);
  });

  test("returns transcribed text on success", async () => {
    transcribeResult = { text: "the quick brown fox" };
    const { handleTranscribe } = await handlerModulePromise;
    const res = await handleTranscribe(
      createRequest({ audio: "abc123", mimeType: "audio/webm" }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { text: string };
    expect(body.text).toBe("the quick brown fox");
    expect(transcribeCalls).toHaveLength(1);
    expect(transcribeCalls[0]?.audio).toBe("abc123");
  });

  test("returns 500 with details on provider failure", async () => {
    transcribeResult = new Error("provider exploded");
    const { handleTranscribe } = await handlerModulePromise;
    const res = await handleTranscribe(createRequest({ audio: "abc" }));
    expect(res.status).toBe(500);
    const body = (await res.json()) as { error: string; details: string };
    expect(body.error).toBe("Transcription failed");
    expect(body.details).toBe("provider exploded");
  });
});
