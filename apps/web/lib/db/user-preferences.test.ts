import { describe, expect, mock, test } from "bun:test";

mock.module("@/lib/supabase/admin", () => ({
  getSupabaseAdmin: () => ({
    rpc: mock(() => Promise.resolve({ data: [], error: null })),
  }),
}));

mock.module("./client", () => ({
  db: {},
}));

const userPreferencesModulePromise = import("./user-preferences");

describe("toUserPreferencesData", () => {
  test("returns defaults when row is undefined", async () => {
    const { toUserPreferencesData } = await userPreferencesModulePromise;

    expect(toUserPreferencesData()).toEqual({
      defaultModelId: "openai/gpt-5.4",
      defaultSubagentModelId: null,
      defaultSandboxType: "just-bash",
      defaultDiffMode: "unified",
      alertsEnabled: true,
      alertSoundEnabled: true,
      modelVariants: [],
      enabledModelIds: [],
    });
  });

  test("normalizes invalid sandbox and diff mode values to defaults", async () => {
    const { toUserPreferencesData } = await userPreferencesModulePromise;

    const result = toUserPreferencesData({
      defaultModelId: "openai/gpt-5",
      defaultSubagentModelId: "openai/gpt-5-mini",
      defaultSandboxType: "invalid" as never,
      defaultDiffMode: "invalid" as never,
      alertsEnabled: true,
      alertSoundEnabled: true,
      modelVariants: [],
      enabledModelIds: [],
    });

    expect(result.defaultSandboxType).toBe("just-bash");
    expect(result.defaultDiffMode).toBe("unified");
  });

  test("normalizes legacy hybrid sandbox types to vercel", async () => {
    const { toUserPreferencesData } = await userPreferencesModulePromise;

    const result = toUserPreferencesData({
      defaultModelId: "openai/gpt-5",
      defaultSubagentModelId: null,
      defaultSandboxType: "hybrid" as never,
      defaultDiffMode: "unified",
      alertsEnabled: true,
      alertSoundEnabled: true,
      modelVariants: [],
      enabledModelIds: [],
    });

    expect(result.defaultSandboxType).toBe("vercel");
    expect(result.defaultDiffMode).toBe("unified");
  });

  test("drops invalid modelVariants payloads", async () => {
    const { toUserPreferencesData } = await userPreferencesModulePromise;

    const result = toUserPreferencesData({
      defaultModelId: "openai/gpt-5",
      defaultSubagentModelId: null,
      defaultSandboxType: "vercel",
      defaultDiffMode: "split",
      alertsEnabled: true,
      alertSoundEnabled: true,
      modelVariants: [{ id: "bad-id" }] as never,
      enabledModelIds: [],
    });

    expect(result.modelVariants).toEqual([]);
  });

  test("keeps valid modelVariants payloads", async () => {
    const { toUserPreferencesData } = await userPreferencesModulePromise;

    const result = toUserPreferencesData({
      defaultModelId: "openai/gpt-5",
      defaultSubagentModelId: null,
      defaultSandboxType: "vercel",
      defaultDiffMode: "split",
      alertsEnabled: true,
      alertSoundEnabled: true,
      modelVariants: [
        {
          id: "variant:test",
          name: "Test Variant",
          baseModelId: "openai/gpt-5",
          providerOptions: { reasoningEffort: "low" },
        },
      ],
      enabledModelIds: [],
    });

    expect(result).toEqual({
      defaultModelId: "openai/gpt-5",
      defaultSubagentModelId: null,
      defaultSandboxType: "vercel",
      defaultDiffMode: "split",
      alertsEnabled: true,
      alertSoundEnabled: true,
      modelVariants: [
        {
          id: "variant:test",
          name: "Test Variant",
          baseModelId: "openai/gpt-5",
          providerOptions: { reasoningEffort: "low" },
        },
      ],
      enabledModelIds: [],
    });
  });

  test("filters enabledModelIds to strings only", async () => {
    const { toUserPreferencesData } = await userPreferencesModulePromise;

    const result = toUserPreferencesData({
      defaultModelId: "openai/gpt-5",
      defaultSubagentModelId: null,
      defaultSandboxType: "vercel",
      defaultDiffMode: "split",
      alertsEnabled: true,
      alertSoundEnabled: true,
      modelVariants: [],
      enabledModelIds: ["openai/gpt-5", 123, null] as never,
    });

    expect(result.enabledModelIds).toEqual(["openai/gpt-5"]);
  });
});
