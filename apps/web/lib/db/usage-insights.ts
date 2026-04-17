import {
  buildUsageInsights,
  type UsageAggregateRow,
  type UsageSessionInsightRow,
} from "@/lib/usage/compute-insights";
import {
  getDateRangeDaysInclusive,
  type UsageDateRange,
} from "@/lib/usage/date-range";
import type { UsageInsights } from "@/lib/usage/types";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { parseTimestampRequired } from "./maps";

export interface UsageInsightsOptions {
  days?: number;
  range?: UsageDateRange;
  allTime?: boolean;
}

function rpcParams(
  userId: string,
  options?: UsageInsightsOptions,
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

function getLookbackDays(options?: UsageInsightsOptions): number {
  if (options?.range) {
    return getDateRangeDaysInclusive(options.range);
  }

  if (options?.allTime) {
    return 0;
  }

  return options?.days ?? 280;
}

export async function getUsageInsights(
  userId: string,
  options?: UsageInsightsOptions,
): Promise<UsageInsights> {
  const params = rpcParams(userId, options);
  const { data, error } = await getSupabaseAdmin().rpc(
    "get_usage_insights_bundle",
    params,
  );

  if (error) {
    throw error;
  }

  let rawBundle: unknown = data;
  if (typeof data === "string") {
    try {
      rawBundle = JSON.parse(data) as unknown;
    } catch {
      rawBundle = { aggregate: {}, sessions: [] };
    }
  }

  const bundle = rawBundle as {
    aggregate: Record<string, unknown>;
    sessions: Record<string, unknown>[];
  };

  const agg = bundle.aggregate ?? {};
  const aggregate: UsageAggregateRow = {
    totalInputTokens: Number(agg.totalInputTokens ?? 0),
    totalCachedInputTokens: Number(agg.totalCachedInputTokens ?? 0),
    totalOutputTokens: Number(agg.totalOutputTokens ?? 0),
    totalToolCallCount: Number(agg.totalToolCallCount ?? 0),
    mainInputTokens: Number(agg.mainInputTokens ?? 0),
    mainOutputTokens: Number(agg.mainOutputTokens ?? 0),
    mainAssistantTurnCount: Number(agg.mainAssistantTurnCount ?? 0),
    largestMainTurnTokens: Number(agg.largestMainTurnTokens ?? 0),
  };

  const sessionRows: UsageSessionInsightRow[] = (bundle.sessions ?? []).map(
    (s) => ({
      repoOwner: s.repoOwner != null ? String(s.repoOwner) : null,
      repoName: s.repoName != null ? String(s.repoName) : null,
      prNumber: s.prNumber != null ? Number(s.prNumber) : null,
      prStatus: s.prStatus as UsageSessionInsightRow["prStatus"],
      linesAdded: s.linesAdded != null ? Number(s.linesAdded) : null,
      linesRemoved: s.linesRemoved != null ? Number(s.linesRemoved) : null,
      updatedAt: parseTimestampRequired(s.updatedAt),
    }),
  );

  return buildUsageInsights({
    lookbackDays: getLookbackDays(options),
    aggregate,
    sessions: sessionRows,
  });
}
