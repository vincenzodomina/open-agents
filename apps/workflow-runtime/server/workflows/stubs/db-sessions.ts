// Phase 3c-1 stub. See ./README.md.
import type { SandboxState } from "@open-harness/sandbox";

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

function logStub(name: string, args?: unknown): void {
  console.warn(`[workflow-runtime/stub] ${name}()`, args ?? "");
}

export async function compareAndSetChatActiveStreamId(
  chatId: string,
  expected: string | null,
  next: string | null,
): Promise<boolean> {
  logStub("compareAndSetChatActiveStreamId", { chatId, expected, next });
  return true;
}

export async function createChatMessageIfNotExists(
  data: NewChatMessage,
): Promise<ChatMessage | null> {
  logStub("createChatMessageIfNotExists", { id: data.id });
  return null;
}

export async function touchChat(
  chatId: string,
  activityAt: Date = new Date(),
): Promise<void> {
  logStub("touchChat", { chatId, activityAt });
}

export async function updateChat(
  _chatId: string,
  _patch: Record<string, unknown>,
): Promise<void> {
  logStub("updateChat");
}

export async function updateSession(
  _sessionId: string,
  _patch: Record<string, unknown>,
): Promise<void> {
  logStub("updateSession");
}

export async function isFirstChatMessage(
  _chatId: string,
  _messageId: string,
): Promise<boolean> {
  logStub("isFirstChatMessage");
  return false;
}

export async function upsertChatMessageScoped(
  _data: NewChatMessage,
): Promise<UpsertChatMessageScopedResult> {
  logStub("upsertChatMessageScoped");
  return { status: "conflict" };
}

export async function updateChatAssistantActivity(
  chatId: string,
  at: Date,
): Promise<void> {
  logStub("updateChatAssistantActivity", { chatId, at });
}

export type { SandboxState };
