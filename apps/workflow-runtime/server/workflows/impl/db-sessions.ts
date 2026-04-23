import type { SandboxState } from "@open-harness/sandbox";
import { getSupabaseAdmin } from "../../utils/supabase-admin";

export type ChatMessage = {
  id: string;
  chatId: string;
  role: "user" | "assistant";
  parts: unknown;
  createdAt: Date;
};

export type NewChatMessage = Omit<ChatMessage, "createdAt"> & {
  createdAt?: Date;
};

export type UpsertChatMessageScopedResult =
  | { status: "inserted"; message: ChatMessage }
  | { status: "updated"; message: ChatMessage }
  | { status: "conflict" };

function mapChatMessageRow(row: Record<string, unknown>): ChatMessage {
  return {
    id: row.id as string,
    chatId: row.chat_id as string,
    role: row.role as "user" | "assistant",
    parts: row.parts,
    createdAt: new Date(row.created_at as string),
  };
}

function sb() {
  return getSupabaseAdmin();
}

export async function compareAndSetChatActiveStreamId(
  chatId: string,
  expectedStreamId: string | null,
  nextStreamId: string | null,
): Promise<boolean> {
  const builder = sb()
    .from("chats")
    .update({ active_stream_id: nextStreamId })
    .eq("id", chatId);

  const filtered =
    expectedStreamId === null
      ? builder.is("active_stream_id", null)
      : builder.eq("active_stream_id", expectedStreamId);

  const { data, error } = await filtered.select("id").maybeSingle();

  if (error) {
    throw error;
  }
  return Boolean(data);
}

export async function createChatMessageIfNotExists(
  data: NewChatMessage,
): Promise<ChatMessage | undefined> {
  const createdAt = data.createdAt ?? new Date();
  const row = {
    id: data.id,
    chat_id: data.chatId,
    role: data.role,
    parts: data.parts,
    created_at: createdAt.toISOString(),
  };
  const { data: inserted, error } = await sb()
    .from("chat_messages")
    .insert(row)
    .select()
    .maybeSingle();

  if (!error && inserted) {
    return mapChatMessageRow(inserted as Record<string, unknown>);
  }
  if (error && (error as { code?: string }).code !== "23505") {
    throw error;
  }
  return undefined;
}

export async function updateChat(
  chatId: string,
  data: Record<string, unknown>,
): Promise<void> {
  const { error } = await sb()
    .from("chats")
    .update(toSnakeCase(data))
    .eq("id", chatId);
  if (error) {
    throw error;
  }
}

export async function touchChat(
  chatId: string,
  activityAt: Date = new Date(),
): Promise<void> {
  await updateChat(chatId, { updatedAt: activityAt.toISOString() });
}

export async function updateChatAssistantActivity(
  chatId: string,
  activityAt: Date,
): Promise<void> {
  const { error } = await sb()
    .from("chats")
    .update({
      last_assistant_message_at: activityAt.toISOString(),
      updated_at: activityAt.toISOString(),
    })
    .eq("id", chatId);
  if (error) {
    throw error;
  }
}

export async function updateSession(
  sessionId: string,
  data: Record<string, unknown>,
): Promise<void> {
  const { error } = await sb()
    .from("sessions")
    .update(toSnakeCase(data))
    .eq("id", sessionId);
  if (error) {
    throw error;
  }
}

export async function isFirstChatMessage(
  chatId: string,
  messageId: string,
): Promise<boolean> {
  const { data, error } = await sb()
    .from("chat_messages")
    .select("id")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true })
    .order("id", { ascending: true })
    .limit(2);

  if (error) {
    throw error;
  }
  const rows = data ?? [];
  return (
    rows.length === 1 && String((rows[0] as { id: string }).id) === messageId
  );
}

export async function upsertChatMessageScoped(
  data: NewChatMessage,
): Promise<UpsertChatMessageScopedResult> {
  const createdAt = data.createdAt ?? new Date();
  const { data: result, error } = await sb().rpc("upsert_chat_message_scoped", {
    p_msg: {
      id: data.id,
      chat_id: data.chatId,
      role: data.role,
      parts: data.parts,
      created_at: createdAt.toISOString(),
    } as object,
  });

  if (error) {
    throw error;
  }

  const payload = result as {
    status: string;
    message?: Record<string, unknown>;
  };

  if (payload.status === "inserted" && payload.message) {
    return { status: "inserted", message: mapChatMessageRow(payload.message) };
  }
  if (payload.status === "updated" && payload.message) {
    return { status: "updated", message: mapChatMessageRow(payload.message) };
  }
  return { status: "conflict" };
}

function toSnakeCase(data: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    const snake = key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
    result[snake] =
      value instanceof Date ? value.toISOString() : (value as unknown);
  }
  return result;
}

export type SessionSummary = {
  id: string;
  userId: string;
  title: string;
};

export type ChatSummary = {
  id: string;
  sessionId: string;
};

export async function getSessionById(
  sessionId: string,
): Promise<SessionSummary | null> {
  const { data, error } = await sb()
    .from("sessions")
    .select("id, user_id, title")
    .eq("id", sessionId)
    .maybeSingle();

  if (error) {
    throw error;
  }
  if (!data) {
    return null;
  }
  const row = data as Record<string, unknown>;
  return {
    id: String(row.id),
    userId: String(row.user_id),
    title: String(row.title ?? ""),
  };
}

export async function getChatsBySessionId(
  sessionId: string,
): Promise<ChatSummary[]> {
  const { data, error } = await sb()
    .from("chats")
    .select("id, session_id")
    .eq("session_id", sessionId)
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }
  return (data ?? []).map((r) => {
    const row = r as Record<string, unknown>;
    return {
      id: String(row.id),
      sessionId: String(row.session_id),
    };
  });
}

export async function getChatMessages(chatId: string): Promise<ChatMessage[]> {
  const { data, error } = await sb()
    .from("chat_messages")
    .select("*")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true })
    .order("id", { ascending: true });

  if (error) {
    throw error;
  }
  return (data ?? []).map((r) =>
    mapChatMessageRow(r as Record<string, unknown>),
  );
}

export type { SandboxState };
