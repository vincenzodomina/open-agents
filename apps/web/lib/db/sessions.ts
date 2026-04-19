import type { SandboxState } from "@open-harness/sandbox";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  mapChatMessageRow,
  mapChatRow,
  mapSessionRow,
  mapShareRow,
  newChatToSnakeInsert,
  newSessionToRpcJson,
  partialChatToSnakeUpdate,
  partialSessionToSnakeUpdate,
  parseTimestamp,
  parseTimestampRequired,
} from "./maps";
import type {
  Chat,
  ChatMessage,
  NewChatMessage,
  NewSession,
  NewShare,
  Session,
} from "./schema";

export function normalizeLegacySandboxState(
  sandboxState: unknown,
): SandboxState | null | undefined {
  if (!sandboxState || typeof sandboxState !== "object") {
    return sandboxState as null | undefined;
  }

  const state = sandboxState as Record<string, unknown>;
  const normalizedType = state.type === "hybrid" ? "vercel" : state.type;
  const sandboxName =
    typeof state.sandboxName === "string" && state.sandboxName.length > 0
      ? state.sandboxName
      : typeof state.sandboxId === "string" && state.sandboxId.length > 0
        ? state.sandboxId
        : undefined;

  if (normalizedType !== "vercel" && normalizedType !== "just-bash") {
    return sandboxState as SandboxState;
  }

  if (normalizedType === state.type && sandboxName === undefined) {
    return sandboxState as SandboxState;
  }

  const normalizedState: Record<string, unknown> = {
    ...state,
    type: normalizedType,
  };

  if (sandboxName !== undefined) {
    normalizedState.sandboxName = sandboxName;
    delete normalizedState.sandboxId;
  }

  return normalizedState as unknown as SandboxState;
}

function normalizeSessionRecord<T extends { sandboxState: unknown }>(
  session: T,
): T {
  return {
    ...session,
    sandboxState: normalizeLegacySandboxState(session.sandboxState) ?? null,
  };
}

function sb() {
  return getSupabaseAdmin();
}

export async function createSession(data: NewSession) {
  const row = newSessionToRpcJson(data);
  const { data: inserted, error } = await sb()
    .from("sessions")
    .insert(row)
    .select()
    .single();
  if (error) {
    throw error;
  }
  if (!inserted) {
    throw new Error("Failed to create session");
  }
  return normalizeSessionRecord(
    mapSessionRow(inserted as Record<string, unknown>),
  );
}

interface CreateSessionWithInitialChatInput {
  session: NewSession;
  initialChat: Pick<Chat, "id" | "title" | "modelId">;
}

export async function createSessionWithInitialChat(
  input: CreateSessionWithInitialChatInput,
) {
  const { data, error } = await sb().rpc("create_session_with_initial_chat", {
    p_session: newSessionToRpcJson(input.session) as object,
    p_initial_chat: {
      id: input.initialChat.id,
      title: input.initialChat.title,
      model_id: input.initialChat.modelId ?? null,
    } as object,
  });

  if (error) {
    throw error;
  }

  const payload = data as {
    session: Record<string, unknown>;
    chat: Record<string, unknown>;
  };

  return {
    session: normalizeSessionRecord(mapSessionRow(payload.session)),
    chat: mapChatRow(payload.chat),
  };
}

export async function getSessionById(sessionId: string) {
  const { data, error } = await sb()
    .from("sessions")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle();

  if (error) {
    throw error;
  }
  if (!data) {
    return null;
  }
  return normalizeSessionRecord(mapSessionRow(data as Record<string, unknown>));
}

export async function getShareById(shareId: string) {
  const { data, error } = await sb()
    .from("shares")
    .select("*")
    .eq("id", shareId)
    .maybeSingle();

  if (error) {
    throw error;
  }
  return data ? mapShareRow(data as Record<string, unknown>) : null;
}

export async function getShareByChatId(chatId: string) {
  const { data, error } = await sb()
    .from("shares")
    .select("*")
    .eq("chat_id", chatId)
    .maybeSingle();

  if (error) {
    throw error;
  }
  return data ? mapShareRow(data as Record<string, unknown>) : null;
}

export async function createShareIfNotExists(data: NewShare) {
  const row = {
    id: data.id,
    chat_id: data.chatId,
    created_at: data.createdAt?.toISOString() ?? new Date().toISOString(),
    updated_at: data.updatedAt?.toISOString() ?? new Date().toISOString(),
  };

  const { data: inserted, error } = await sb()
    .from("shares")
    .insert(row)
    .select()
    .maybeSingle();

  if (!error && inserted) {
    return mapShareRow(inserted as Record<string, unknown>);
  }

  if (error && (error as { code?: string }).code !== "23505") {
    throw error;
  }

  return getShareByChatId(data.chatId);
}

export async function deleteShareByChatId(chatId: string) {
  const { error } = await sb().from("shares").delete().eq("chat_id", chatId);
  if (error) {
    throw error;
  }
}

export async function getSessionsByUserId(userId: string) {
  const { data, error } = await sb()
    .from("sessions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }
  return (data ?? []).map((r) =>
    normalizeSessionRecord(mapSessionRow(r as Record<string, unknown>)),
  );
}

export async function countSessionsByUserId(userId: string): Promise<number> {
  const { count, error } = await sb()
    .from("sessions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) {
    throw error;
  }
  return count ?? 0;
}

export async function countUserMessagesByUserId(
  userId: string,
): Promise<number> {
  const { data, error } = await sb().rpc("count_user_messages_by_user_id", {
    p_user_id: userId,
  });

  if (error) {
    throw error;
  }
  return typeof data === "number" ? data : Number(data ?? 0);
}

type SessionSidebarFields = Pick<
  Session,
  | "id"
  | "title"
  | "status"
  | "repoOwner"
  | "repoName"
  | "branch"
  | "linesAdded"
  | "linesRemoved"
  | "prNumber"
  | "prStatus"
  | "createdAt"
>;

export type SessionWithUnread = SessionSidebarFields & {
  hasUnread: boolean;
  hasStreaming: boolean;
  latestChatId: string | null;
  lastActivityAt: Date;
};

type GetSessionsWithUnreadByUserIdOptions = {
  status?: "all" | "active" | "archived";
  limit?: number;
  offset?: number;
};

export async function getSessionsWithUnreadByUserId(
  userId: string,
  options?: GetSessionsWithUnreadByUserIdOptions,
): Promise<SessionWithUnread[]> {
  const status = options?.status ?? "all";

  const { data, error } = await sb().rpc("get_sessions_with_unread", {
    p_user_id: userId,
    p_status: status,
    p_limit: options?.limit ?? null,
    p_offset: options?.offset ?? null,
  });

  if (error) {
    throw error;
  }

  let parsed: unknown = data;
  if (typeof data === "string") {
    try {
      parsed = JSON.parse(data) as unknown;
    } catch {
      parsed = [];
    }
  }
  const rows = (Array.isArray(parsed) ? parsed : []) as Record<
    string,
    unknown
  >[];

  return rows.map((row) => ({
    id: String(row.id),
    title: String(row.title),
    status: row.status as Session["status"],
    repoOwner: row.repoOwner != null ? String(row.repoOwner) : null,
    repoName: row.repoName != null ? String(row.repoName) : null,
    branch: row.branch != null ? String(row.branch) : null,
    linesAdded: row.linesAdded != null ? Number(row.linesAdded) : null,
    linesRemoved: row.linesRemoved != null ? Number(row.linesRemoved) : null,
    prNumber: row.prNumber != null ? Number(row.prNumber) : null,
    prStatus: row.prStatus as Session["prStatus"],
    createdAt: parseTimestampRequired(row.createdAt),
    lastActivityAt: parseTimestampRequired(row.lastActivityAt),
    hasUnread: Boolean(row.hasUnread),
    hasStreaming: Boolean(row.hasStreaming),
    latestChatId:
      row.latestChatId != null && row.latestChatId !== ""
        ? String(row.latestChatId)
        : null,
  }));
}

export async function getArchivedSessionCountByUserId(
  userId: string,
): Promise<number> {
  const { count, error } = await sb()
    .from("sessions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "archived");

  if (error) {
    throw error;
  }
  return count ?? 0;
}

export async function getUsedSessionTitles(
  userId: string,
): Promise<Set<string>> {
  const { data, error } = await sb()
    .from("sessions")
    .select("title")
    .eq("user_id", userId);

  if (error) {
    throw error;
  }
  return new Set(
    (data ?? []).map((r) => String((r as { title: string }).title)),
  );
}

export async function updateSession(
  sessionId: string,
  data: Partial<Omit<NewSession, "id" | "userId" | "createdAt">>,
) {
  const patch = partialSessionToSnakeUpdate(data);
  const { data: updated, error } = await sb()
    .from("sessions")
    .update(patch)
    .eq("id", sessionId)
    .select()
    .maybeSingle();

  if (error) {
    throw error;
  }
  return updated
    ? normalizeSessionRecord(mapSessionRow(updated as Record<string, unknown>))
    : null;
}

export async function claimSessionLifecycleRunId(
  sessionId: string,
  runId: string,
) {
  const { data, error } = await sb()
    .from("sessions")
    .update({
      lifecycle_run_id: runId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sessionId)
    .is("lifecycle_run_id", null)
    .select("id")
    .maybeSingle();

  if (error) {
    throw error;
  }
  return Boolean(data);
}

export async function deleteSession(sessionId: string) {
  const { error } = await sb().from("sessions").delete().eq("id", sessionId);
  if (error) {
    throw error;
  }
}

export async function createChat(data: {
  id: string;
  sessionId: string;
  title: string;
  modelId?: string | null;
  activeStreamId?: string | null;
  lastAssistantMessageAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}) {
  const row = newChatToSnakeInsert(data);
  const { data: inserted, error } = await sb()
    .from("chats")
    .insert(row)
    .select()
    .single();

  if (error) {
    throw error;
  }
  if (!inserted) {
    throw new Error("Failed to create chat");
  }
  return mapChatRow(inserted as Record<string, unknown>);
}

export async function getChatById(chatId: string) {
  const { data, error } = await sb()
    .from("chats")
    .select("*")
    .eq("id", chatId)
    .maybeSingle();

  if (error) {
    throw error;
  }
  return data ? mapChatRow(data as Record<string, unknown>) : null;
}

export async function getChatsBySessionId(sessionId: string) {
  const { data, error } = await sb()
    .from("chats")
    .select("*")
    .eq("session_id", sessionId)
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }
  return (data ?? []).map((r) => mapChatRow(r as Record<string, unknown>));
}

export type ChatSummary = Chat & {
  hasUnread: boolean;
  isStreaming: boolean;
};

export async function getChatSummariesBySessionId(
  sessionId: string,
  userId: string,
): Promise<ChatSummary[]> {
  const { data, error } = await sb().rpc("get_chat_summaries_for_session", {
    p_session_id: sessionId,
    p_user_id: userId,
  });

  if (error) {
    throw error;
  }

  let parsed: unknown = data;
  if (typeof data === "string") {
    try {
      parsed = JSON.parse(data) as unknown;
    } catch {
      parsed = [];
    }
  }
  const rows = (Array.isArray(parsed) ? parsed : []) as Record<
    string,
    unknown
  >[];

  return rows.map((row) => ({
    id: String(row.id),
    sessionId: String(row.sessionId),
    title: String(row.title),
    modelId: row.modelId != null ? String(row.modelId) : null,
    activeStreamId:
      row.activeStreamId != null ? String(row.activeStreamId) : null,
    lastAssistantMessageAt: parseTimestamp(row.lastAssistantMessageAt),
    createdAt: parseTimestampRequired(row.createdAt),
    updatedAt: parseTimestampRequired(row.updatedAt),
    hasUnread: Boolean(row.hasUnread),
    isStreaming: Boolean(row.isStreaming),
  }));
}

export async function updateChat(
  chatId: string,
  data: Partial<Omit<Chat, "id" | "sessionId" | "createdAt">>,
) {
  const patch = partialChatToSnakeUpdate(data);
  const { data: updated, error } = await sb()
    .from("chats")
    .update(patch)
    .eq("id", chatId)
    .select()
    .maybeSingle();

  if (error) {
    throw error;
  }
  return updated ? mapChatRow(updated as Record<string, unknown>) : null;
}

export async function touchChat(chatId: string, activityAt = new Date()) {
  return updateChat(chatId, { updatedAt: activityAt });
}

export async function updateChatAssistantActivity(
  chatId: string,
  activityAt: Date,
) {
  const { data: updated, error } = await sb()
    .from("chats")
    .update({
      last_assistant_message_at: activityAt.toISOString(),
      updated_at: activityAt.toISOString(),
    })
    .eq("id", chatId)
    .select()
    .maybeSingle();

  if (error) {
    throw error;
  }
  return updated ? mapChatRow(updated as Record<string, unknown>) : null;
}

export async function updateChatActiveStreamId(
  chatId: string,
  streamId: string | null,
) {
  const { error } = await sb()
    .from("chats")
    .update({ active_stream_id: streamId })
    .eq("id", chatId);

  if (error) {
    throw error;
  }
}

export async function compareAndSetChatActiveStreamId(
  chatId: string,
  expectedStreamId: string | null,
  nextStreamId: string | null,
) {
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

export async function deleteChat(chatId: string) {
  const { error } = await sb().from("chats").delete().eq("id", chatId);
  if (error) {
    throw error;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function cloneChatMessagePartsWithId(parts: unknown, id: string): unknown {
  const clonedParts = structuredClone(parts);
  if (!isRecord(clonedParts)) {
    return clonedParts;
  }

  return {
    ...clonedParts,
    id,
  };
}

type ForkChatThroughMessageInput = {
  userId: string;
  sourceChatId: string;
  throughMessageId: string;
  forkedChat: Pick<Chat, "id" | "sessionId" | "title" | "modelId">;
};

type ForkChatThroughMessageResult =
  | { status: "created"; chat: Chat }
  | { status: "message_not_found" }
  | { status: "not_assistant_message" };

export async function forkChatThroughMessage(
  input: ForkChatThroughMessageInput,
): Promise<ForkChatThroughMessageResult> {
  const { data: msgRows, error: msgErr } = await sb()
    .from("chat_messages")
    .select("id, role, parts, created_at")
    .eq("chat_id", input.sourceChatId)
    .order("created_at", { ascending: true })
    .order("id", { ascending: true });

  if (msgErr) {
    throw msgErr;
  }

  const sourceMessages = (msgRows ?? []).map((r) => {
    const row = r as Record<string, unknown>;
    return {
      id: String(row.id),
      role: row.role as "user" | "assistant",
      parts: row.parts,
      createdAt: parseTimestampRequired(row.created_at),
    };
  });

  const throughMessageIndex = sourceMessages.findIndex(
    (message) => message.id === input.throughMessageId,
  );
  if (throughMessageIndex < 0) {
    return { status: "message_not_found" };
  }

  const throughMessage = sourceMessages[throughMessageIndex];
  if (!throughMessage || throughMessage.role !== "assistant") {
    return { status: "not_assistant_message" };
  }

  const now = new Date();
  const forkedChatPayload = {
    id: input.forkedChat.id,
    session_id: input.forkedChat.sessionId,
    title: input.forkedChat.title,
    model_id: input.forkedChat.modelId ?? "openai/gpt-5-mini",
    last_assistant_message_at: throughMessage.createdAt.toISOString(),
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  };

  const messagesToCopy = sourceMessages.slice(0, throughMessageIndex + 1);
  const messagesJson = messagesToCopy.map((message) => {
    const forkedMessageId = crypto.randomUUID();
    return {
      id: forkedMessageId,
      role: message.role,
      parts: cloneChatMessagePartsWithId(message.parts, forkedMessageId),
      created_at: message.createdAt.toISOString(),
    };
  });

  const { data, error } = await sb().rpc("fork_chat_apply", {
    p_user_id: input.userId,
    p_forked_chat: forkedChatPayload as object,
    p_messages: messagesJson as object,
  });

  if (error) {
    throw error;
  }

  const payload = data as { chat: Record<string, unknown> };
  return {
    status: "created",
    chat: mapChatRow(payload.chat),
  };
}

export async function createChatMessage(data: NewChatMessage) {
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
    .single();

  if (error) {
    throw error;
  }
  if (!inserted) {
    throw new Error("Failed to create chat message");
  }
  return mapChatMessageRow(inserted as Record<string, unknown>);
}

export async function createChatMessageIfNotExists(data: NewChatMessage) {
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

export async function upsertChatMessage(data: NewChatMessage) {
  const createdAt = data.createdAt ?? new Date();
  const { data: inserted, error } = await sb()
    .from("chat_messages")
    .upsert(
      {
        id: data.id,
        chat_id: data.chatId,
        role: data.role,
        parts: data.parts,
        created_at: createdAt.toISOString(),
      },
      { onConflict: "id" },
    )
    .select()
    .single();

  if (error) {
    throw error;
  }
  if (!inserted) {
    throw new Error("upsert failed");
  }
  return mapChatMessageRow(inserted as Record<string, unknown>);
}

type UpsertChatMessageScopedResult =
  | { status: "inserted"; message: ChatMessage }
  | { status: "updated"; message: ChatMessage }
  | { status: "conflict" };

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
    return {
      status: "inserted",
      message: mapChatMessageRow(payload.message),
    };
  }
  if (payload.status === "updated" && payload.message) {
    return {
      status: "updated",
      message: mapChatMessageRow(payload.message),
    };
  }
  return { status: "conflict" };
}

export async function getChatMessageById(messageId: string) {
  const { data, error } = await sb()
    .from("chat_messages")
    .select("*")
    .eq("id", messageId)
    .maybeSingle();

  if (error) {
    throw error;
  }
  return data ? mapChatMessageRow(data as Record<string, unknown>) : null;
}

export async function getChatMessages(chatId: string) {
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

type DeleteChatMessageAndFollowingResult =
  | { status: "not_found" }
  | { status: "not_user_message" }
  | { status: "deleted"; deletedMessageIds: string[] };

export async function deleteChatMessageAndFollowing(
  chatId: string,
  messageId: string,
): Promise<DeleteChatMessageAndFollowingResult> {
  const { data, error } = await sb().rpc("delete_chat_message_and_following", {
    p_chat_id: chatId,
    p_message_id: messageId,
  });

  if (error) {
    throw error;
  }

  const payload = data as {
    status: string;
    deleted_message_ids?: string[];
  };

  if (payload.status === "not_found") {
    return { status: "not_found" };
  }
  if (payload.status === "not_user_message") {
    return { status: "not_user_message" };
  }
  if (payload.status === "deleted") {
    return {
      status: "deleted",
      deletedMessageIds: payload.deleted_message_ids ?? [],
    };
  }
  return { status: "not_found" };
}

export async function isFirstChatMessage(chatId: string, messageId: string) {
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

export async function markChatRead(
  data: Pick<import("./schema").ChatRead, "userId" | "chatId">,
) {
  const now = new Date().toISOString();
  const row = {
    user_id: data.userId,
    chat_id: data.chatId,
    last_read_at: now,
    created_at: now,
    updated_at: now,
  };

  const { data: upserted, error } = await sb()
    .from("chat_reads")
    .upsert(row, { onConflict: "user_id,chat_id" })
    .select()
    .single();

  if (error) {
    throw error;
  }
  if (!upserted) {
    throw new Error("markChatRead failed");
  }

  const r = upserted as Record<string, unknown>;
  return {
    userId: String(r.user_id),
    chatId: String(r.chat_id),
    lastReadAt: parseTimestampRequired(r.last_read_at),
    createdAt: parseTimestampRequired(r.created_at),
    updatedAt: parseTimestampRequired(r.updated_at),
  };
}
