import { type LanguageModel, type UIMessage, isToolUIPart } from "ai";
import { nanoid } from "nanoid";
import { getSupabaseAdmin } from "../../utils/supabase-admin";

type UsageSource = "web" | "runtime" | "workflow";
type UsageAgentType = "main" | "subagent";

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
): Promise<void> {
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
