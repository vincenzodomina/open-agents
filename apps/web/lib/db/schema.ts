/**
 * Database types are generated (`database.types.ts`). App-layer types below add
 * camelCase + `Date` for timestamps and stricter JSON unions where we own the shape.
 */
import type { SandboxState } from "@open-harness/sandbox";
import type { ModelVariant } from "@/lib/model-variants";
import type { GlobalSkillRef } from "@/lib/skills/global-skill-refs";
import type { Database, Json } from "./database.types";

export type { Database, Json };

export type PublicTableName = keyof Database["public"]["Tables"];

export type TableRow<T extends PublicTableName> =
  Database["public"]["Tables"][T]["Row"];
export type TableInsert<T extends PublicTableName> =
  Database["public"]["Tables"][T]["Insert"];
export type TableUpdate<T extends PublicTableName> =
  Database["public"]["Tables"][T]["Update"];

/** Raw PostgREST row shapes (snake_case, ISO timestamps as strings). */
export type SessionRow = TableRow<"sessions">;
export type ChatRow = TableRow<"chats">;
export type ChatMessageRow = TableRow<"chat_messages">;
export type ChatReadRow = TableRow<"chat_reads">;
export type UserRow = TableRow<"users">;
export type UserPreferencesRow = TableRow<"user_preferences">;
export type WorkflowRunRow = TableRow<"workflow_runs">;
export type WorkflowRunStepRow = TableRow<"workflow_run_steps">;

type SR = SessionRow;

/** Application `sessions` row: camelCase + Date; JSON columns use app-owned types. */
export type Session = {
  id: SR["id"];
  userId: SR["user_id"];
  title: SR["title"];
  status: SR["status"];
  globalSkillRefs: GlobalSkillRef[];
  sandboxState: SandboxState | null | undefined;
  lifecycleState: SR["lifecycle_state"];
  lifecycleVersion: SR["lifecycle_version"];
  lastActivityAt: Date | null;
  sandboxExpiresAt: Date | null;
  hibernateAfter: Date | null;
  lifecycleRunId: SR["lifecycle_run_id"];
  lifecycleError: SR["lifecycle_error"];
  snapshotUrl: SR["snapshot_url"];
  snapshotCreatedAt: Date | null;
  snapshotSizeBytes: SR["snapshot_size_bytes"];
  createdAt: Date;
  updatedAt: Date;
};

export type NewSession = Partial<Session> &
  Pick<Session, "userId" | "title"> & {
    id?: string;
  };

type CR = ChatRow;

export type Chat = {
  id: CR["id"];
  sessionId: CR["session_id"];
  title: CR["title"];
  modelId: CR["model_id"];
  activeStreamId: CR["active_stream_id"];
  lastAssistantMessageAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type NewChat = Omit<Chat, "createdAt" | "updatedAt"> & {
  createdAt?: Date;
  updatedAt?: Date;
};

type CmR = ChatMessageRow;

export type ChatMessage = {
  id: CmR["id"];
  chatId: CmR["chat_id"];
  role: CmR["role"];
  /** Serialized UI message payload; not limited to `Json` at compile time. */
  parts: unknown;
  createdAt: Date;
};

export type NewChatMessage = Omit<ChatMessage, "createdAt"> & {
  createdAt?: Date;
};

type CrR = ChatReadRow;

export type ChatRead = {
  userId: CrR["user_id"];
  chatId: CrR["chat_id"];
  lastReadAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type NewChatRead = ChatRead;

type WrR = WorkflowRunRow;

export type WorkflowRun = {
  id: WrR["id"];
  chatId: WrR["chat_id"];
  sessionId: WrR["session_id"];
  userId: WrR["user_id"];
  modelId: WrR["model_id"];
  status: WrR["status"];
  startedAt: Date;
  finishedAt: Date;
  totalDurationMs: WrR["total_duration_ms"];
  createdAt: Date;
};

export type NewWorkflowRun = Omit<WorkflowRun, "createdAt"> & {
  createdAt?: Date;
};

type WsR = WorkflowRunStepRow;

export type WorkflowRunStep = {
  id: WsR["id"];
  workflowRunId: WsR["workflow_run_id"];
  stepNumber: WsR["step_number"];
  startedAt: Date;
  finishedAt: Date;
  durationMs: WsR["duration_ms"];
  finishReason: WsR["finish_reason"];
  rawFinishReason: WsR["raw_finish_reason"];
  createdAt: Date;
};

export type NewWorkflowRunStep = Omit<WorkflowRunStep, "createdAt"> & {
  createdAt?: Date;
};

type UpR = UserPreferencesRow;

export type UserPreferences = {
  id: UpR["id"];
  userId: UpR["user_id"];
  defaultModelId: UpR["default_model_id"];
  defaultSubagentModelId: UpR["default_subagent_model_id"];
  defaultSandboxType: UpR["default_sandbox_type"];
  defaultDiffMode: UpR["default_diff_mode"];
  alertsEnabled: UpR["alerts_enabled"];
  alertSoundEnabled: UpR["alert_sound_enabled"];
  modelVariants: ModelVariant[];
  enabledModelIds: string[];
  createdAt: Date;
  updatedAt: Date;
};

export type NewUserPreferences = Omit<
  UserPreferences,
  "id" | "createdAt" | "updatedAt"
> & {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

/** Full `users` row in app shape (camelCase + Date). Rarely used; most reads select subsets. */
type Ur = UserRow;

export type User = {
  id: Ur["id"];
  username: Ur["username"];
  email: Ur["email"];
  name: Ur["name"];
  avatarUrl: Ur["avatar_url"];
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date;
};

export type NewUser = Omit<User, "createdAt" | "updatedAt" | "lastLoginAt"> & {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
  lastLoginAt?: Date;
};
