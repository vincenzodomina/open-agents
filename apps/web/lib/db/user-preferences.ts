import { nanoid } from "nanoid";
import type { SandboxType } from "@/components/sandbox-selector-compact";
import { modelVariantsSchema, type ModelVariant } from "@/lib/model-variants";
import { APP_DEFAULT_MODEL_ID } from "@/lib/models";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { mapUserPreferencesRow } from "./maps";
import type { UserPreferences } from "./schema";

export type DiffMode = "unified" | "split";

export interface UserPreferencesData {
  defaultModelId: string;
  defaultSubagentModelId: string | null;
  defaultSandboxType: SandboxType;
  defaultDiffMode: DiffMode;
  alertsEnabled: boolean;
  alertSoundEnabled: boolean;
  modelVariants: ModelVariant[];
  enabledModelIds: string[];
}

const DEFAULT_PREFERENCES: UserPreferencesData = {
  defaultModelId: APP_DEFAULT_MODEL_ID,
  defaultSubagentModelId: null,
  defaultSandboxType: "just-bash",
  defaultDiffMode: "unified",
  alertsEnabled: true,
  alertSoundEnabled: true,
  modelVariants: [],
  enabledModelIds: [],
};

const VALID_SANDBOX_TYPES: SandboxType[] = ["just-bash", "vercel"];
const VALID_DIFF_MODES: DiffMode[] = ["unified", "split"];

function normalizeSandboxType(value: unknown): SandboxType {
  if (value === "hybrid") {
    return "vercel";
  }

  if (
    typeof value === "string" &&
    VALID_SANDBOX_TYPES.includes(value as SandboxType)
  ) {
    return value as SandboxType;
  }

  return DEFAULT_PREFERENCES.defaultSandboxType;
}

function normalizeDiffMode(value: unknown): DiffMode {
  if (
    typeof value === "string" &&
    VALID_DIFF_MODES.includes(value as DiffMode)
  ) {
    return value as DiffMode;
  }

  return DEFAULT_PREFERENCES.defaultDiffMode;
}

function normalizeEnabledModelIds(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === "string");
}

export function toUserPreferencesData(
  row?: Pick<
    UserPreferences,
    | "defaultModelId"
    | "defaultSubagentModelId"
    | "defaultSandboxType"
    | "defaultDiffMode"
    | "alertsEnabled"
    | "alertSoundEnabled"
    | "modelVariants"
    | "enabledModelIds"
  >,
): UserPreferencesData {
  const parsedModelVariants = modelVariantsSchema.safeParse(
    row?.modelVariants ?? [],
  );

  return {
    defaultModelId: row?.defaultModelId ?? DEFAULT_PREFERENCES.defaultModelId,
    defaultSubagentModelId: row?.defaultSubagentModelId ?? null,
    defaultSandboxType: normalizeSandboxType(row?.defaultSandboxType),
    defaultDiffMode: normalizeDiffMode(row?.defaultDiffMode),
    alertsEnabled: row?.alertsEnabled ?? DEFAULT_PREFERENCES.alertsEnabled,
    alertSoundEnabled:
      row?.alertSoundEnabled ?? DEFAULT_PREFERENCES.alertSoundEnabled,
    modelVariants: parsedModelVariants.success ? parsedModelVariants.data : [],
    enabledModelIds: normalizeEnabledModelIds(row?.enabledModelIds),
  };
}

export async function getUserPreferences(
  userId: string,
): Promise<UserPreferencesData> {
  const { data, error } = await getSupabaseAdmin()
    .from("user_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return toUserPreferencesData(
    data ? mapUserPreferencesRow(data as Record<string, unknown>) : undefined,
  );
}

export async function updateUserPreferences(
  userId: string,
  updates: Partial<UserPreferencesData>,
): Promise<UserPreferencesData> {
  const sb = getSupabaseAdmin();
  const { data: existing, error: findErr } = await sb
    .from("user_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (findErr) {
    throw findErr;
  }

  const patchSnake: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (updates.defaultModelId !== undefined) {
    patchSnake.default_model_id = updates.defaultModelId;
  }
  if (updates.defaultSubagentModelId !== undefined) {
    patchSnake.default_subagent_model_id = updates.defaultSubagentModelId;
  }
  if (updates.defaultSandboxType !== undefined) {
    patchSnake.default_sandbox_type = updates.defaultSandboxType;
  }
  if (updates.defaultDiffMode !== undefined) {
    patchSnake.default_diff_mode = updates.defaultDiffMode;
  }
  if (updates.alertsEnabled !== undefined) {
    patchSnake.alerts_enabled = updates.alertsEnabled;
  }
  if (updates.alertSoundEnabled !== undefined) {
    patchSnake.alert_sound_enabled = updates.alertSoundEnabled;
  }
  if (updates.modelVariants !== undefined) {
    patchSnake.model_variants = updates.modelVariants;
  }
  if (updates.enabledModelIds !== undefined) {
    patchSnake.enabled_model_ids = updates.enabledModelIds;
  }

  if (existing) {
    const { data: updated, error } = await sb
      .from("user_preferences")
      .update(patchSnake)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      throw error;
    }
    return toUserPreferencesData(
      mapUserPreferencesRow(updated as Record<string, unknown>),
    );
  }

  const base = toUserPreferencesData();
  const merged: UserPreferencesData = {
    ...base,
    ...updates,
  };

  const { data: created, error } = await sb
    .from("user_preferences")
    .insert({
      id: nanoid(),
      user_id: userId,
      default_model_id: merged.defaultModelId,
      default_subagent_model_id: merged.defaultSubagentModelId,
      default_sandbox_type: merged.defaultSandboxType,
      default_diff_mode: merged.defaultDiffMode,
      alerts_enabled: merged.alertsEnabled,
      alert_sound_enabled: merged.alertSoundEnabled,
      model_variants: merged.modelVariants,
      enabled_model_ids: merged.enabledModelIds,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return toUserPreferencesData(
    mapUserPreferencesRow(created as Record<string, unknown>),
  );
}
