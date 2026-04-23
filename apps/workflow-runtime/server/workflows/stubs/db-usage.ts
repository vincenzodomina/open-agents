// Phase 3c-1 stub. See ./README.md.
import type { LanguageModel, UIMessage } from "ai";

type UsageSource = "web" | "runtime" | "workflow";
type UsageAgentType = "main" | "subagent";

export async function recordUsage(
  _userId: string,
  _data: {
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
  console.warn("[workflow-runtime/stub] recordUsage()");
}
