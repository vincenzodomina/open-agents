import { beforeEach, describe, expect, mock, test } from "bun:test";

type UpsertMode = "inserted" | "updated" | "conflict";

let upsertMode: UpsertMode = "inserted";

let fakeSelectRows: { title: string }[] = [];

const fakeInsertedMessage = {
  id: "message-1",
  chat_id: "chat-1",
  role: "assistant",
  parts: { id: "message-1", role: "assistant", parts: [] },
  created_at: new Date().toISOString(),
};

function createFakeSupabase() {
  return {
    from(_table: string) {
      return {
        select(_cols?: string) {
          return {
            eq: async (_c: string, _v: string) => ({
              data: fakeSelectRows,
              error: null,
            }),
          };
        },
      };
    },
    async rpc(name: string) {
      if (name !== "upsert_chat_message_scoped") {
        return { data: null, error: new Error(`unexpected rpc ${name}`) };
      }
      if (upsertMode === "inserted") {
        return {
          data: {
            status: "inserted",
            message: fakeInsertedMessage,
          },
          error: null,
        };
      }
      if (upsertMode === "updated") {
        return {
          data: {
            status: "updated",
            message: fakeInsertedMessage,
          },
          error: null,
        };
      }
      return { data: { status: "conflict" }, error: null };
    },
  };
}

mock.module("@/lib/supabase/admin", () => ({
  getSupabaseAdmin: createFakeSupabase,
}));

const sessionsModulePromise = import("./sessions");

describe("normalizeLegacySandboxState", () => {
  test("rewrites legacy vercel-compatible sandbox ids onto sandboxName", async () => {
    const { normalizeLegacySandboxState } = await sessionsModulePromise;

    const result = normalizeLegacySandboxState({
      type: "hybrid",
      sandboxId: "sbx-legacy-1",
      snapshotId: "snap-legacy-1",
      expiresAt: 123,
    });

    expect(result).toEqual({
      type: "vercel",
      sandboxName: "sbx-legacy-1",
      snapshotId: "snap-legacy-1",
      expiresAt: 123,
    });
  });

  test("moves persisted session_<id> identifiers onto sandboxName", async () => {
    const { normalizeLegacySandboxState } = await sessionsModulePromise;

    expect(
      normalizeLegacySandboxState({
        type: "vercel",
        sandboxId: "session_123",
        expiresAt: 456,
      }),
    ).toEqual({
      type: "vercel",
      sandboxName: "session_123",
      expiresAt: 456,
    });
  });

  test("leaves supported sandbox states unchanged", async () => {
    const { normalizeLegacySandboxState } = await sessionsModulePromise;

    const state = {
      type: "vercel",
      sandboxName: "session_current-1",
      expiresAt: 456,
    } as const;

    expect(normalizeLegacySandboxState(state)).toEqual(state);
  });
});

describe("getUsedSessionTitles", () => {
  beforeEach(() => {
    fakeSelectRows = [];
  });

  test("returns an empty Set when the user has no sessions", async () => {
    const { getUsedSessionTitles } = await sessionsModulePromise;
    fakeSelectRows = [];

    const result = await getUsedSessionTitles("user-1");
    expect(result).toBeInstanceOf(Set);
    expect(result.size).toBe(0);
  });

  test("returns a Set containing all existing session titles", async () => {
    const { getUsedSessionTitles } = await sessionsModulePromise;
    fakeSelectRows = [
      { title: "Tokyo" },
      { title: "Paris" },
      { title: "Lagos" },
    ];

    const result = await getUsedSessionTitles("user-1");
    expect(result.size).toBe(3);
    expect(result.has("Tokyo")).toBe(true);
    expect(result.has("Paris")).toBe(true);
    expect(result.has("Lagos")).toBe(true);
  });

  test("deduplicates titles if the DB returns duplicates", async () => {
    const { getUsedSessionTitles } = await sessionsModulePromise;
    fakeSelectRows = [{ title: "Rome" }, { title: "Rome" }];

    const result = await getUsedSessionTitles("user-1");
    expect(result.size).toBe(1);
    expect(result.has("Rome")).toBe(true);
  });
});

describe("upsertChatMessageScoped", () => {
  beforeEach(() => {
    upsertMode = "inserted";
  });

  test("returns inserted when no existing row conflicts", async () => {
    const { upsertChatMessageScoped } = await sessionsModulePromise;
    upsertMode = "inserted";

    const result = await upsertChatMessageScoped({
      id: "message-1",
      chatId: "chat-1",
      role: "assistant",
      parts: { id: "message-1", role: "assistant", parts: [] },
      createdAt: new Date(),
    });

    expect(result.status).toBe("inserted");
  });

  test("returns updated when id exists in same chat and role", async () => {
    const { upsertChatMessageScoped } = await sessionsModulePromise;
    upsertMode = "updated";

    const result = await upsertChatMessageScoped({
      id: "message-1",
      chatId: "chat-1",
      role: "assistant",
      parts: { id: "message-1", role: "assistant", parts: [{ type: "text" }] },
      createdAt: new Date(),
    });

    expect(result.status).toBe("updated");
  });

  test("returns conflict when id exists for different chat/role scope", async () => {
    const { upsertChatMessageScoped } = await sessionsModulePromise;
    upsertMode = "conflict";

    const result = await upsertChatMessageScoped({
      id: "message-1",
      chatId: "chat-1",
      role: "assistant",
      parts: { id: "message-1", role: "assistant", parts: [{ type: "text" }] },
      createdAt: new Date(),
    });

    expect(result.status).toBe("conflict");
  });
});
