import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";

const requestedUrls: string[] = [];

let modelsDevApiData: unknown = {};
let currentSession: {
  authProvider?: "supabase";
  user: { id: string; email?: string; username?: string; avatar?: string };
} | null = null;

const originalFetch = globalThis.fetch;

function getRequestUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") {
    return input;
  }
  if (input instanceof URL) {
    return input.toString();
  }
  return input.url;
}

mock.module("server-only", () => ({}));

mock.module("@/lib/session/get-server-session", () => ({
  getServerSession: async () => currentSession,
}));

const routeModulePromise = import("./route");

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("/api/models (models.dev OpenAI catalog)", () => {
  beforeEach(() => {
    requestedUrls.length = 0;
    modelsDevApiData = {};
    currentSession = null;

    globalThis.fetch = mock((input: RequestInfo | URL, _init?: RequestInit) => {
      requestedUrls.push(getRequestUrl(input));
      return Promise.resolve(
        new Response(JSON.stringify(modelsDevApiData), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    }) as unknown as typeof fetch;
  });

  test("returns OpenAI language models from models.dev with cost and context", async () => {
    modelsDevApiData = {
      openai: {
        models: {
          "gpt-5.4": {
            id: "gpt-5.4",
            name: "GPT-5.4",
            description: "Flagship model",
            modalities: { input: ["text"], output: ["text"] },
            limit: { context: 400_000 },
            cost: { input: 1.25, output: 10 },
          },
          "gpt-5-mini": {
            id: "gpt-5-mini",
            name: "GPT-5 Mini",
            modalities: { input: ["text"], output: ["text"] },
            limit: { context: 200_000 },
          },
        },
      },
    };

    const { GET } = await routeModulePromise;
    const response = await GET(new Request("http://localhost/api/models"));

    expect(response.ok).toBe(true);

    const body = (await response.json()) as {
      models: Array<{
        id: string;
        name: string;
        context_window?: number;
        cost?: { input?: number; output?: number };
      }>;
    };

    expect(requestedUrls).toContain("https://models.dev/api.json");
    expect(body.models.map((m) => m.id).sort()).toEqual([
      "openai/gpt-5-mini",
      "openai/gpt-5.4",
    ]);

    const gpt54 = body.models.find((m) => m.id === "openai/gpt-5.4");
    expect(gpt54?.context_window).toBe(400_000);
    expect(gpt54?.cost).toEqual({ input: 1.25, output: 10 });
  });

  test("excludes non-text models", async () => {
    modelsDevApiData = {
      openai: {
        models: {
          "dall-e-3": {
            id: "dall-e-3",
            name: "DALL-E 3",
            modalities: { input: ["text"], output: ["image"] },
          },
          "gpt-4o": {
            id: "gpt-4o",
            name: "GPT-4o",
            modalities: { input: ["text", "image"], output: ["text"] },
          },
        },
      },
    };

    const { GET } = await routeModulePromise;
    const response = await GET(new Request("http://localhost/api/models"));
    const body = (await response.json()) as { models: Array<{ id: string }> };

    expect(body.models.map((m) => m.id)).toEqual(["openai/gpt-4o"]);
  });

  test("includes GPT-5.4 Pro models for managed trial users", async () => {
    modelsDevApiData = {
      openai: {
        models: {
          "gpt-5.4-pro": {
            id: "gpt-5.4-pro",
            name: "GPT-5.4 Pro",
            modalities: { input: ["text"], output: ["text"] },
          },
          "gpt-5-mini": {
            id: "gpt-5-mini",
            name: "GPT-5 Mini",
            modalities: { input: ["text"], output: ["text"] },
          },
        },
      },
    };
    currentSession = {
      authProvider: "supabase",
      user: { id: "user-1", email: "person@example.com" },
    };

    const { GET } = await routeModulePromise;
    const response = await GET(
      new Request("https://open-agents.dev/api/models"),
    );
    const body = (await response.json()) as { models: Array<{ id: string }> };

    expect(body.models.map((m) => m.id)).toEqual([
      "openai/gpt-5-mini",
      "openai/gpt-5.4-pro",
    ]);
  });

  test("returns empty list when models.dev fetch fails", async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(new Response("error", { status: 500 })),
    ) as unknown as typeof fetch;

    const { GET } = await routeModulePromise;
    const response = await GET(new Request("http://localhost/api/models"));
    const body = (await response.json()) as { models: unknown[] };

    expect(response.ok).toBe(true);
    expect(body.models).toEqual([]);
  });

  test("keeps valid models.dev metadata when sibling fields are invalid", async () => {
    modelsDevApiData = {
      openai: {
        models: {
          "gpt-5.3-codex": {
            id: "gpt-5.3-codex",
            name: "Codex",
            modalities: { input: ["text"], output: ["text"] },
            limit: { context: "not-a-number" },
            cost: { input: 1.25, output: 10 },
          },
        },
      },
    };

    const { GET } = await routeModulePromise;
    const response = await GET(new Request("http://localhost/api/models"));
    const body = (await response.json()) as {
      models: Array<{
        id: string;
        cost?: { input?: number; output?: number };
      }>;
    };

    expect(body.models).toHaveLength(1);
    expect(body.models[0]?.id).toBe("openai/gpt-5.3-codex");
    expect(body.models[0]?.cost).toEqual({ input: 1.25, output: 10 });
  });
});
