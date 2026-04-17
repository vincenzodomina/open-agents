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
export type ShareRow = TableRow<"shares">;
export type UserRow = TableRow<"users">;
export type AccountRow = TableRow<"accounts">;
export type GitHubInstallationRow = TableRow<"github_installations">;
export type LinkedAccountRow = TableRow<"linked_accounts">;
export type UserPreferencesRow = TableRow<"user_preferences">;
export type UsageEventRow = TableRow<"usage_events">;
export type WorkflowRunRow = TableRow<"workflow_runs">;
export type WorkflowRunStepRow = TableRow<"workflow_run_steps">;

type SR = SessionRow;

/** Application `sessions` row: camelCase + Date; JSON columns use app-owned types. */
export type Session = {
  id: SR["id"];
  userId: SR["user_id"];
  title: SR["title"];
  status: SR["status"];
  repoOwner: SR["repo_owner"];
  repoName: SR["repo_name"];
  branch: SR["branch"];
  cloneUrl: SR["clone_url"];
  isNewBranch: SR["is_new_branch"];
  autoCommitPushOverride: SR["auto_commit_push_override"];
  autoCreatePrOverride: SR["auto_create_pr_override"];
  globalSkillRefs: GlobalSkillRef[];
  sandboxState: SandboxState | null | undefined;
  lifecycleState: SR["lifecycle_state"];
  lifecycleVersion: SR["lifecycle_version"];
  lastActivityAt: Date | null;
  sandboxExpiresAt: Date | null;
  hibernateAfter: Date | null;
  lifecycleRunId: SR["lifecycle_run_id"];
  lifecycleError: SR["lifecycle_error"];
  linesAdded: SR["lines_added"];
  linesRemoved: SR["lines_removed"];
  prNumber: SR["pr_number"];
  /** DB column is `text`; narrowed for UI. */
  prStatus: "open" | "merged" | "closed" | null;
  snapshotUrl: SR["snapshot_url"];
  snapshotCreatedAt: Date | null;
  snapshotSizeBytes: SR["snapshot_size_bytes"];
  cachedDiff: SR["cached_diff"];
  cachedDiffUpdatedAt: Date | null;
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

type ShR = ShareRow;

export type Share = {
  id: ShR["id"];
  chatId: ShR["chat_id"];
  createdAt: Date;
  updatedAt: Date;
};

export type NewShare = Omit<Share, "createdAt" | "updatedAt"> & {
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

type GiR = GitHubInstallationRow;

export type GitHubInstallation = {
  id: GiR["id"];
  userId: GiR["user_id"];
  installationId: GiR["installation_id"];
  accountLogin: GiR["account_login"];
  /** DB `text` check constraint; narrowed for app code. */
  accountType: "User" | "Organization";
  repositorySelection: "all" | "selected";
  installationUrl: GiR["installation_url"];
  createdAt: Date;
  updatedAt: Date;
};

export type NewGitHubInstallation = Omit<
  GitHubInstallation,
  "id" | "createdAt" | "updatedAt"
> & {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

type LaR = LinkedAccountRow;

export type LinkedAccount = {
  id: LaR["id"];
  userId: LaR["user_id"];
  provider: LaR["provider"];
  externalId: LaR["external_id"];
  workspaceId: LaR["workspace_id"];
  metadata: LaR["metadata"];
  createdAt: Date;
  updatedAt: Date;
};

export type NewLinkedAccount = Omit<
  LinkedAccount,
  "id" | "createdAt" | "updatedAt"
> & {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

type UpR = UserPreferencesRow;

export type UserPreferences = {
  id: UpR["id"];
  userId: UpR["user_id"];
  defaultModelId: UpR["default_model_id"];
  defaultSubagentModelId: UpR["default_subagent_model_id"];
  defaultSandboxType: UpR["default_sandbox_type"];
  defaultDiffMode: UpR["default_diff_mode"];
  autoCommitPush: UpR["auto_commit_push"];
  autoCreatePr: UpR["auto_create_pr"];
  alertsEnabled: UpR["alerts_enabled"];
  alertSoundEnabled: UpR["alert_sound_enabled"];
  publicUsageEnabled: UpR["public_usage_enabled"];
  globalSkillRefs: GlobalSkillRef[];
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

type UeR = UsageEventRow;

export type UsageEvent = {
  id: UeR["id"];
  userId: UeR["user_id"];
  source: UeR["source"];
  agentType: UeR["agent_type"];
  provider: UeR["provider"];
  modelId: UeR["model_id"];
  inputTokens: UeR["input_tokens"];
  cachedInputTokens: UeR["cached_input_tokens"];
  outputTokens: UeR["output_tokens"];
  toolCallCount: UeR["tool_call_count"];
  createdAt: Date;
};

export type NewUsageEvent = Omit<UsageEvent, "id" | "createdAt"> & {
  id?: string;
  createdAt?: Date;
};

/** Full `users` row in app shape (camelCase + Date). Rarely used; most reads select subsets. */
type Ur = UserRow;

export type User = {
  id: Ur["id"];
  provider: Ur["provider"];
  externalId: Ur["external_id"];
  accessToken: Ur["access_token"];
  refreshToken: Ur["refresh_token"];
  scope: Ur["scope"];
  username: Ur["username"];
  email: Ur["email"];
  name: Ur["name"];
  avatarUrl: Ur["avatar_url"];
  createdAt: Date;
  tokenExpiresAt: Date | null;
  updatedAt: Date;
  lastLoginAt: Date;
};

export type NewUser = Omit<User, "createdAt" | "updatedAt" | "lastLoginAt"> & {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
  lastLoginAt?: Date;
};

type Ar = AccountRow;

export type Account = {
  id: Ar["id"];
  userId: Ar["user_id"];
  provider: Ar["provider"];
  externalUserId: Ar["external_user_id"];
  accessToken: Ar["access_token"];
  refreshToken: Ar["refresh_token"];
  expiresAt: Date | null;
  scope: Ar["scope"];
  username: Ar["username"];
  createdAt: Date;
  updatedAt: Date;
};

export type NewAccount = Omit<Account, "id" | "createdAt" | "updatedAt"> & {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
};
