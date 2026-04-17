import type { UsageDateRange } from "@/lib/usage/date-range";
import { getUsageLeaderboardDomain } from "@/lib/usage/leaderboard-domain";
import type {
  UsageDomainLeaderboard,
  UsageDomainLeaderboardRow,
} from "@/lib/usage/types";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export { getUsageLeaderboardDomain };

interface UsageDomainLeaderboardQueryRow {
  userId: string;
  email: string | null;
  username: string;
  name: string | null;
  avatarUrl: string | null;
  modelId: string | null;
  totalInputTokens: number;
  totalOutputTokens: number;
}

export interface UsageDomainLeaderboardOptions {
  days?: number;
  range?: UsageDateRange;
}

function rpcParams(
  domain: string,
  options?: UsageDomainLeaderboardOptions,
): {
  p_domain: string;
  p_range_from: string | null;
  p_range_to: string | null;
  p_days: number | null;
} {
  if (options?.range) {
    return {
      p_domain: domain,
      p_range_from: options.range.from,
      p_range_to: options.range.to,
      p_days: null,
    };
  }

  return {
    p_domain: domain,
    p_range_from: null,
    p_range_to: null,
    p_days: options?.days ?? 280,
  };
}

function shouldReplaceMostUsedModel(params: {
  currentModelId: string | null;
  currentTokens: number;
  candidateModelId: string | null;
  candidateTokens: number;
}): boolean {
  const { currentModelId, currentTokens, candidateModelId, candidateTokens } =
    params;

  if (candidateTokens > currentTokens) {
    return true;
  }

  if (candidateTokens < currentTokens) {
    return false;
  }

  if (currentModelId === null && candidateModelId !== null) {
    return true;
  }

  if (currentModelId !== null && candidateModelId === null) {
    return false;
  }

  if (currentModelId === null || candidateModelId === null) {
    return false;
  }

  return candidateModelId < currentModelId;
}

export function buildUsageDomainLeaderboardRows(
  rows: UsageDomainLeaderboardQueryRow[],
): UsageDomainLeaderboardRow[] {
  const leaderboard = new Map<string, UsageDomainLeaderboardRow>();

  for (const row of rows) {
    if (!row.email) {
      continue;
    }

    const modelTokens = row.totalInputTokens + row.totalOutputTokens;
    const existing = leaderboard.get(row.userId);

    if (existing) {
      existing.totalTokens += modelTokens;
      if (
        shouldReplaceMostUsedModel({
          currentModelId: existing.mostUsedModelId,
          currentTokens: existing.mostUsedModelTokens,
          candidateModelId: row.modelId,
          candidateTokens: modelTokens,
        })
      ) {
        existing.mostUsedModelId = row.modelId;
        existing.mostUsedModelTokens = modelTokens;
      }
      continue;
    }

    leaderboard.set(row.userId, {
      userId: row.userId,
      username: row.username,
      name: row.name,
      avatarUrl: row.avatarUrl,
      totalTokens: modelTokens,
      mostUsedModelId: row.modelId,
      mostUsedModelTokens: modelTokens,
    });
  }

  return [...leaderboard.values()]
    .filter((row) => row.totalTokens > 0)
    .toSorted((a, b) => {
      if (b.totalTokens !== a.totalTokens) {
        return b.totalTokens - a.totalTokens;
      }

      const usernameOrder = a.username.localeCompare(b.username);
      if (usernameOrder !== 0) {
        return usernameOrder;
      }

      return a.userId.localeCompare(b.userId);
    });
}

export async function getUsageDomainLeaderboard(
  email: string | null | undefined,
  options?: UsageDomainLeaderboardOptions,
): Promise<UsageDomainLeaderboard | null> {
  const domain = getUsageLeaderboardDomain(email);
  if (!domain) {
    return null;
  }

  const params = rpcParams(domain, options);
  const { data, error } = await getSupabaseAdmin().rpc(
    "get_usage_domain_leaderboard_rows",
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

  const mapped: UsageDomainLeaderboardQueryRow[] = rows.map((row) => ({
    userId: String(row.userId),
    email: row.email != null ? String(row.email) : null,
    username: String(row.username),
    name: row.name != null ? String(row.name) : null,
    avatarUrl: row.avatarUrl != null ? String(row.avatarUrl) : null,
    modelId: row.modelId != null ? String(row.modelId) : null,
    totalInputTokens: Number(row.totalInputTokens),
    totalOutputTokens: Number(row.totalOutputTokens),
  }));

  return {
    domain,
    rows: buildUsageDomainLeaderboardRows(mapped),
  };
}
