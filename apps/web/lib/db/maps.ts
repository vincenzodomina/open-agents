import type { SandboxState } from "@open-harness/sandbox";
import type { ModelVariant } from "@/lib/model-variants";
import type { GlobalSkillRef } from "@/lib/skills/global-skill-refs";
import type {
  Chat,
  ChatMessage,
  ChatRead,
  Json,
  LinkedAccount,
  NewSession,
  Session,
  Share,
  UsageEvent,
  UserPreferences,
  WorkflowRun,
  WorkflowRunStep,
} from "./schema";

export function parseTimestamp(value: unknown): Date | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (value instanceof Date) {
    return value;
  }
  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

export function parseTimestampRequired(value: unknown): Date {
  return parseTimestamp(value) ?? new Date(0);
}

/** Map a sessions row (snake_case keys from PostgREST / json) to Session */
export function mapSessionRow(row: Record<string, unknown>): Session {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    title: String(row.title),
    status: row.status as Session["status"],
    repoOwner: row.repo_owner != null ? String(row.repo_owner) : null,
    repoName: row.repo_name != null ? String(row.repo_name) : null,
    branch: row.branch != null ? String(row.branch) : null,
    cloneUrl: row.clone_url != null ? String(row.clone_url) : null,
    isNewBranch: Boolean(row.is_new_branch ?? false),
    autoCommitPushOverride:
      row.auto_commit_push_override === null ||
      row.auto_commit_push_override === undefined
        ? null
        : Boolean(row.auto_commit_push_override),
    autoCreatePrOverride:
      row.auto_create_pr_override === null ||
      row.auto_create_pr_override === undefined
        ? null
        : Boolean(row.auto_create_pr_override),
    globalSkillRefs: (row.global_skill_refs ?? []) as GlobalSkillRef[],
    sandboxState: row.sandbox_state as SandboxState | null | undefined,
    lifecycleState: row.lifecycle_state as Session["lifecycleState"],
    lifecycleVersion: Number(row.lifecycle_version ?? 0),
    lastActivityAt: parseTimestamp(row.last_activity_at),
    sandboxExpiresAt: parseTimestamp(row.sandbox_expires_at),
    hibernateAfter: parseTimestamp(row.hibernate_after),
    lifecycleRunId:
      row.lifecycle_run_id != null ? String(row.lifecycle_run_id) : null,
    lifecycleError:
      row.lifecycle_error != null ? String(row.lifecycle_error) : null,
    linesAdded: row.lines_added != null ? Number(row.lines_added) : 0,
    linesRemoved: row.lines_removed != null ? Number(row.lines_removed) : 0,
    prNumber: row.pr_number != null ? Number(row.pr_number) : null,
    prStatus: row.pr_status as Session["prStatus"],
    snapshotUrl: row.snapshot_url != null ? String(row.snapshot_url) : null,
    snapshotCreatedAt: parseTimestamp(row.snapshot_created_at),
    snapshotSizeBytes:
      row.snapshot_size_bytes != null ? Number(row.snapshot_size_bytes) : null,
    cachedDiff: row.cached_diff as Session["cachedDiff"],
    cachedDiffUpdatedAt: parseTimestamp(row.cached_diff_updated_at),
    createdAt: parseTimestampRequired(row.created_at),
    updatedAt: parseTimestampRequired(row.updated_at),
  };
}

export function mapChatRow(row: Record<string, unknown>): Chat {
  return {
    id: String(row.id),
    sessionId: String(row.session_id),
    title: String(row.title),
    modelId: row.model_id != null ? String(row.model_id) : "openai/gpt-5.4",
    activeStreamId:
      row.active_stream_id != null ? String(row.active_stream_id) : null,
    lastAssistantMessageAt: parseTimestamp(row.last_assistant_message_at),
    createdAt: parseTimestampRequired(row.created_at),
    updatedAt: parseTimestampRequired(row.updated_at),
  };
}

export function mapChatMessageRow(row: Record<string, unknown>): ChatMessage {
  return {
    id: String(row.id),
    chatId: String(row.chat_id),
    role: row.role as ChatMessage["role"],
    parts: row.parts as ChatMessage["parts"],
    createdAt: parseTimestampRequired(row.created_at),
  };
}

export function mapShareRow(row: Record<string, unknown>): Share {
  return {
    id: String(row.id),
    chatId: String(row.chat_id),
    createdAt: parseTimestampRequired(row.created_at),
    updatedAt: parseTimestampRequired(row.updated_at),
  };
}

export function mapChatReadRow(row: Record<string, unknown>): ChatRead {
  return {
    userId: String(row.user_id),
    chatId: String(row.chat_id),
    lastReadAt: parseTimestampRequired(row.last_read_at),
    createdAt: parseTimestampRequired(row.created_at),
    updatedAt: parseTimestampRequired(row.updated_at),
  };
}

export function mapWorkflowRunRow(row: Record<string, unknown>): WorkflowRun {
  return {
    id: String(row.id),
    chatId: String(row.chat_id),
    sessionId: String(row.session_id),
    userId: String(row.user_id),
    modelId: row.model_id != null ? String(row.model_id) : null,
    status: row.status as WorkflowRun["status"],
    startedAt: parseTimestampRequired(row.started_at),
    finishedAt: parseTimestampRequired(row.finished_at),
    totalDurationMs: Number(row.total_duration_ms),
    createdAt: parseTimestampRequired(row.created_at),
  };
}

export function mapUserRow(row: Record<string, unknown>): {
  id: string;
  username: string;
  name: string | null;
  avatarUrl: string | null;
} {
  return {
    id: String(row.id),
    username: String(row.username),
    name: row.name != null ? String(row.name) : null,
    avatarUrl: row.avatar_url != null ? String(row.avatar_url) : null,
  };
}

export function mapLinkedAccountRow(
  row: Record<string, unknown>,
): LinkedAccount {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    provider: row.provider as LinkedAccount["provider"],
    externalId: String(row.external_id),
    workspaceId: row.workspace_id != null ? String(row.workspace_id) : null,
    metadata: row.metadata as Json | null,
    createdAt: parseTimestampRequired(row.created_at),
    updatedAt: parseTimestampRequired(row.updated_at),
  };
}

export function mapUserPreferencesRow(
  row: Record<string, unknown>,
): UserPreferences {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    defaultModelId:
      row.default_model_id != null
        ? String(row.default_model_id)
        : "openai/gpt-5-mini",
    defaultSubagentModelId:
      row.default_subagent_model_id != null
        ? String(row.default_subagent_model_id)
        : null,
    defaultSandboxType:
      row.default_sandbox_type as UserPreferences["defaultSandboxType"],
    defaultDiffMode:
      row.default_diff_mode as UserPreferences["defaultDiffMode"],
    alertsEnabled: Boolean(row.alerts_enabled ?? true),
    alertSoundEnabled: Boolean(row.alert_sound_enabled ?? true),
    modelVariants: (row.model_variants ?? []) as ModelVariant[],
    enabledModelIds: (row.enabled_model_ids ?? []) as string[],
    createdAt: parseTimestampRequired(row.created_at),
    updatedAt: parseTimestampRequired(row.updated_at),
  };
}

export function mapUsageEventRow(row: Record<string, unknown>): UsageEvent {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    source: row.source as UsageEvent["source"],
    agentType: row.agent_type as UsageEvent["agentType"],
    provider: row.provider != null ? String(row.provider) : null,
    modelId: row.model_id != null ? String(row.model_id) : null,
    inputTokens: Number(row.input_tokens ?? 0),
    cachedInputTokens: Number(row.cached_input_tokens ?? 0),
    outputTokens: Number(row.output_tokens ?? 0),
    toolCallCount: Number(row.tool_call_count ?? 0),
    createdAt: parseTimestampRequired(row.created_at),
  };
}

export function mapWorkflowRunStepRow(
  row: Record<string, unknown>,
): WorkflowRunStep {
  return {
    id: String(row.id),
    workflowRunId: String(row.workflow_run_id),
    stepNumber: Number(row.step_number),
    startedAt: parseTimestampRequired(row.started_at),
    finishedAt: parseTimestampRequired(row.finished_at),
    durationMs: Number(row.duration_ms),
    finishReason: row.finish_reason != null ? String(row.finish_reason) : null,
    rawFinishReason:
      row.raw_finish_reason != null ? String(row.raw_finish_reason) : null,
    createdAt: parseTimestampRequired(row.created_at),
  };
}

function ts(value: Date | null | undefined): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  return value.toISOString();
}

/** Payload for `create_session_with_initial_chat` (snake_case JSON keys). */
export function newSessionToRpcJson(
  session: NewSession,
): Record<string, unknown> {
  const s = session;
  return {
    ...(s.id !== undefined ? { id: s.id } : {}),
    user_id: s.userId,
    title: s.title,
    status: s.status,
    repo_owner: s.repoOwner,
    repo_name: s.repoName,
    branch: s.branch,
    clone_url: s.cloneUrl,
    is_new_branch: s.isNewBranch,
    auto_commit_push_override: s.autoCommitPushOverride,
    auto_create_pr_override: s.autoCreatePrOverride,
    global_skill_refs: s.globalSkillRefs,
    sandbox_state: s.sandboxState ?? null,
    lifecycle_state: s.lifecycleState ?? null,
    lifecycle_version: s.lifecycleVersion ?? 0,
    last_activity_at: ts(s.lastActivityAt),
    sandbox_expires_at: ts(s.sandboxExpiresAt),
    hibernate_after: ts(s.hibernateAfter),
    lifecycle_run_id: s.lifecycleRunId,
    lifecycle_error: s.lifecycleError,
    lines_added: s.linesAdded,
    lines_removed: s.linesRemoved,
    pr_number: s.prNumber,
    pr_status: s.prStatus,
    snapshot_url: s.snapshotUrl,
    snapshot_created_at: ts(s.snapshotCreatedAt),
    snapshot_size_bytes: s.snapshotSizeBytes,
    cached_diff: s.cachedDiff ?? null,
    cached_diff_updated_at: ts(s.cachedDiffUpdatedAt),
    // `create_session_with_initial_chat` uses jsonb_populate_record; omitted keys
    // become NULL, so NOT NULL columns must always be set for new sessions.
    created_at:
      s.createdAt !== undefined
        ? s.createdAt.toISOString()
        : new Date().toISOString(),
    updated_at:
      s.updatedAt !== undefined
        ? s.updatedAt.toISOString()
        : new Date().toISOString(),
  };
}

export function partialSessionToSnakeUpdate(
  data: Partial<Omit<NewSession, "id" | "userId" | "createdAt">>,
): Record<string, unknown> {
  const o: Record<string, unknown> = {};
  if (data.title !== undefined) {
    o.title = data.title;
  }
  if (data.status !== undefined) {
    o.status = data.status;
  }
  if (data.repoOwner !== undefined) {
    o.repo_owner = data.repoOwner;
  }
  if (data.repoName !== undefined) {
    o.repo_name = data.repoName;
  }
  if (data.branch !== undefined) {
    o.branch = data.branch;
  }
  if (data.cloneUrl !== undefined) {
    o.clone_url = data.cloneUrl;
  }
  if (data.isNewBranch !== undefined) {
    o.is_new_branch = data.isNewBranch;
  }
  if (data.autoCommitPushOverride !== undefined) {
    o.auto_commit_push_override = data.autoCommitPushOverride;
  }
  if (data.autoCreatePrOverride !== undefined) {
    o.auto_create_pr_override = data.autoCreatePrOverride;
  }
  if (data.globalSkillRefs !== undefined) {
    o.global_skill_refs = data.globalSkillRefs;
  }
  if (data.sandboxState !== undefined) {
    o.sandbox_state = data.sandboxState;
  }
  if (data.lifecycleState !== undefined) {
    o.lifecycle_state = data.lifecycleState;
  }
  if (data.lifecycleVersion !== undefined) {
    o.lifecycle_version = data.lifecycleVersion;
  }
  if (data.lastActivityAt !== undefined) {
    o.last_activity_at = data.lastActivityAt?.toISOString() ?? null;
  }
  if (data.sandboxExpiresAt !== undefined) {
    o.sandbox_expires_at = data.sandboxExpiresAt?.toISOString() ?? null;
  }
  if (data.hibernateAfter !== undefined) {
    o.hibernate_after = data.hibernateAfter?.toISOString() ?? null;
  }
  if (data.lifecycleRunId !== undefined) {
    o.lifecycle_run_id = data.lifecycleRunId;
  }
  if (data.lifecycleError !== undefined) {
    o.lifecycle_error = data.lifecycleError;
  }
  if (data.linesAdded !== undefined) {
    o.lines_added = data.linesAdded;
  }
  if (data.linesRemoved !== undefined) {
    o.lines_removed = data.linesRemoved;
  }
  if (data.prNumber !== undefined) {
    o.pr_number = data.prNumber;
  }
  if (data.prStatus !== undefined) {
    o.pr_status = data.prStatus;
  }
  if (data.snapshotUrl !== undefined) {
    o.snapshot_url = data.snapshotUrl;
  }
  if (data.snapshotCreatedAt !== undefined) {
    o.snapshot_created_at = data.snapshotCreatedAt?.toISOString() ?? null;
  }
  if (data.snapshotSizeBytes !== undefined) {
    o.snapshot_size_bytes = data.snapshotSizeBytes;
  }
  if (data.cachedDiff !== undefined) {
    o.cached_diff = data.cachedDiff;
  }
  if (data.cachedDiffUpdatedAt !== undefined) {
    o.cached_diff_updated_at = data.cachedDiffUpdatedAt?.toISOString() ?? null;
  }
  if (data.updatedAt !== undefined) {
    o.updated_at = data.updatedAt.toISOString();
  } else {
    o.updated_at = new Date().toISOString();
  }
  return o;
}

export function newChatToSnakeInsert(data: {
  id: string;
  sessionId: string;
  title: string;
  modelId?: string | null;
  activeStreamId?: string | null;
  lastAssistantMessageAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}): Record<string, unknown> {
  const now = new Date().toISOString();
  return {
    id: data.id,
    session_id: data.sessionId,
    title: data.title,
    model_id: data.modelId ?? "openai/gpt-5-mini",
    active_stream_id: data.activeStreamId ?? null,
    last_assistant_message_at:
      data.lastAssistantMessageAt?.toISOString() ?? null,
    created_at: data.createdAt?.toISOString() ?? now,
    updated_at: data.updatedAt?.toISOString() ?? now,
  };
}

export function partialChatToSnakeUpdate(
  data: Partial<Omit<Chat, "id" | "sessionId" | "createdAt">>,
): Record<string, unknown> {
  const o: Record<string, unknown> = {};
  if (data.title !== undefined) {
    o.title = data.title;
  }
  if (data.modelId !== undefined) {
    o.model_id = data.modelId;
  }
  if (data.activeStreamId !== undefined) {
    o.active_stream_id = data.activeStreamId;
  }
  if (data.lastAssistantMessageAt !== undefined) {
    o.last_assistant_message_at =
      data.lastAssistantMessageAt?.toISOString() ?? null;
  }
  if (data.updatedAt !== undefined) {
    o.updated_at = data.updatedAt.toISOString();
  } else {
    o.updated_at = new Date().toISOString();
  }
  return o;
}
