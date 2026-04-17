import { isToolUIPart, type LanguageModel, type UIMessage } from "ai";
import { nanoid } from "nanoid";
import type { UsageDateRange } from "@/lib/usage/date-range";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export type UsageSource = "web";
export type UsageAgentType = "main" | "subagent";

export async function recordUsage(
  userId: string,
  data: {
    source: UsageSource;
    agentType?: UsageAgentType;
    model: LanguageModel | string;
    messages: UIMessage[];
    usage: {
      inputTokens: number;
      cachedInputTokens: number;
      outputTokens: number;
    };
    toolCallCount?: number;
  },
) {
  const inferredToolCallCount = data.messages
    .flatMap((m) => m.parts)
    .filter(isToolUIPart).length;
  const toolCallCount = data.toolCallCount ?? inferredToolCallCount;

  const provider =
    typeof data.model === "string"
      ? data.model.split("/")[0]
      : data.model.provider;
  const modelId =
    typeof data.model === "string" ? data.model : data.model.modelId;

  const { error } = await getSupabaseAdmin()
    .from("usage_events")
    .insert({
      id: nanoid(),
      user_id: userId,
      source: data.source,
      agent_type: data.agentType ?? "main",
      provider: provider ?? null,
      model_id: modelId ?? null,
      input_tokens: data.usage.inputTokens,
      cached_input_tokens: data.usage.cachedInputTokens,
      output_tokens: data.usage.outputTokens,
      tool_call_count: toolCallCount,
    });

  if (error) {
    throw error;
  }
}

export interface DailyUsage {
  date: string;
  source: UsageSource;
  agentType: UsageAgentType;
  provider: string | null;
  modelId: string | null;
  inputTokens: number;
  cachedInputTokens: number;
  outputTokens: number;
  messageCount: number;
  toolCallCount: number;
}

export interface UsageHistoryOptions {
  days?: number;
  range?: UsageDateRange;
  allTime?: boolean;
}

function rpcParamsForUsageHistory(
  userId: string,
  options?: UsageHistoryOptions,
): {
  p_user_id: string;
  p_range_from: string | null;
  p_range_to: string | null;
  p_all_time: boolean;
  p_days: number | null;
} {
  if (options?.range) {
    return {
      p_user_id: userId,
      p_range_from: options.range.from,
      p_range_to: options.range.to,
      p_all_time: false,
      p_days: null,
    };
  }

  if (options?.allTime) {
    return {
      p_user_id: userId,
      p_range_from: null,
      p_range_to: null,
      p_all_time: true,
      p_days: null,
    };
  }

  return {
    p_user_id: userId,
    p_range_from: null,
    p_range_to: null,
    p_all_time: false,
    p_days: options?.days ?? 280,
  };
}

export async function getUsageHistory(
  userId: string,
  options?: UsageHistoryOptions,
): Promise<DailyUsage[]> {
  const params = rpcParamsForUsageHistory(userId, options);
  const { data, error } = await getSupabaseAdmin().rpc(
    "get_usage_history_rows",
    params,
  );

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
    date: String(row.date),
    source: row.source as UsageSource,
    agentType: row.agentType as UsageAgentType,
    provider: row.provider != null ? String(row.provider) : null,
    modelId: row.modelId != null ? String(row.modelId) : null,
    inputTokens: Number(row.inputTokens),
    cachedInputTokens: Number(row.cachedInputTokens),
    outputTokens: Number(row.outputTokens),
    messageCount: Number(row.messageCount),
    toolCallCount: Number(row.toolCallCount),
  }));
}
