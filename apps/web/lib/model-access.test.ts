import { describe, expect, test } from "bun:test";
import type { UserPreferencesData } from "@/lib/db/user-preferences";
import type { ModelVariant } from "@/lib/model-variants";
import {
  filterModelsForSession,
  filterModelVariantsForSession,
  sanitizeSelectedModelIdForSession,
  sanitizeUserPreferencesForSession,
} from "./model-access";

const managedTrialSession = {
  authProvider: "supabase" as const,
  user: {
    id: "user-1",
    username: "alice",
    email: "alice@example.com",
    avatar: "",
  },
};

const requestUrl = "https://open-agents.dev/api/test";

const userProVariant: ModelVariant = {
  id: "variant:user-pro",
  name: "User Pro",
  baseModelId: "openai/gpt-5.4-pro",
  providerOptions: { reasoningEffort: "high" },
};

const basePreferences: UserPreferencesData = {
  defaultModelId: "openai/gpt-5.4-pro",
  defaultSubagentModelId: "variant:builtin:gpt-5.4-medium",
  defaultSandboxType: "vercel",
  defaultDiffMode: "unified",
  autoCommitPush: false,
  autoCreatePr: false,
  alertsEnabled: true,
  alertSoundEnabled: true,
  publicUsageEnabled: false,
  globalSkillRefs: [],
  modelVariants: [userProVariant],
  enabledModelIds: ["openai/gpt-5.4-pro", "openai/gpt-5"],
};

describe("model access (no hosted trial model restrictions)", () => {
  test("does not filter models by session", () => {
    const models = [{ id: "openai/gpt-5.4-pro" }, { id: "openai/gpt-5-mini" }];
    expect(
      filterModelsForSession(models, managedTrialSession, requestUrl),
    ).toEqual(models);
  });

  test("does not filter variants by session", () => {
    const variants = [
      userProVariant,
      {
        id: "variant:user-gpt",
        name: "User GPT",
        baseModelId: "openai/gpt-5",
        providerOptions: {},
      },
    ];
    expect(
      filterModelVariantsForSession(variants, managedTrialSession, requestUrl),
    ).toEqual(variants);
  });

  test("preserves selected model id including Pro-backed variants", () => {
    expect(
      sanitizeSelectedModelIdForSession(
        "variant:user-pro",
        [userProVariant],
        managedTrialSession,
        requestUrl,
      ),
    ).toBe("variant:user-pro");
  });

  test("leaves preferences unchanged for all sessions", () => {
    expect(
      sanitizeUserPreferencesForSession(
        basePreferences,
        managedTrialSession,
        requestUrl,
      ),
    ).toEqual(basePreferences);
  });
});
