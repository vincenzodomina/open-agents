import type { SandboxState } from "@open-harness/sandbox";
import type { ModelVariant } from "@/lib/model-variants";
import type { GlobalSkillRef } from "@/lib/skills/global-skill-refs";
import type {
  Chat,
  ChatMessage,
  ChatRead,
  NewSession,
  Session,
  Share,
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
    snapshotUrl: row.snapshot_url != null ? String(row.snapshot_url) : null,
    snapshotCreatedAt: parseTimestamp(row.snapshot_created_at),
    snapshotSizeBytes:
      row.snapshot_size_bytes != null ? Number(row.snapshot_size_bytes) : null,
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
    status: s.status ?? "running",
    global_skill_refs: s.globalSkillRefs ?? [],
    sandbox_state: s.sandboxState ?? null,
    lifecycle_state: s.lifecycleState ?? null,
    lifecycle_version: s.lifecycleVersion ?? 0,
    last_activity_at: ts(s.lastActivityAt),
    sandbox_expires_at: ts(s.sandboxExpiresAt),
    hibernate_after: ts(s.hibernateAfter),
    lifecycle_run_id: s.lifecycleRunId,
    lifecycle_error: s.lifecycleError,
    snapshot_url: s.snapshotUrl,
    snapshot_created_at: ts(s.snapshotCreatedAt),
    snapshot_size_bytes: s.snapshotSizeBytes,
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
  if (data.snapshotUrl !== undefined) {
    o.snapshot_url = data.snapshotUrl;
  }
  if (data.snapshotCreatedAt !== undefined) {
    o.snapshot_created_at = data.snapshotCreatedAt?.toISOString() ?? null;
  }
  if (data.snapshotSizeBytes !== undefined) {
    o.snapshot_size_bytes = data.snapshotSizeBytes;
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
