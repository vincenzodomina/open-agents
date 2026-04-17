import "server-only";

import { z } from "zod";
import { filterDisabledModels } from "./model-availability";
import type {
  AvailableModel,
  AvailableModelCost,
  AvailableModelCostTier,
} from "./models";

const MODELS_DEV_URL = "https://models.dev/api.json";
const MODELS_DEV_TIMEOUT_MS = 750;

const recordSchema = z.object({}).catchall(z.unknown());

const modelsDevLimitSchema = z
  .object({
    context: z.number().finite().positive().optional(),
  })
  .passthrough();

const modelsDevCostTierSchema = z
  .object({
    input: z.number().finite().optional(),
    output: z.number().finite().optional(),
    cache_read: z.number().finite().optional(),
  })
  .passthrough();

function getModelsDevCostTier(
  value: unknown,
): AvailableModelCostTier | undefined {
  const parsed = modelsDevCostTierSchema.safeParse(value);
  if (!parsed.success) {
    return undefined;
  }

  const { input, output, cache_read } = parsed.data;
  if (input === undefined && output === undefined && cache_read === undefined) {
    return undefined;
  }

  return {
    input,
    output,
    cache_read,
  };
}

function getModelsDevCost(value: unknown): AvailableModelCost | undefined {
  const parsed = recordSchema.safeParse(value);
  if (!parsed.success) {
    return undefined;
  }

  const baseCost = getModelsDevCostTier(parsed.data);
  const contextOver200k = getModelsDevCostTier(parsed.data.context_over_200k);

  if (!baseCost && !contextOver200k) {
    return undefined;
  }

  return {
    ...baseCost,
    ...(contextOver200k ? { context_over_200k: contextOver200k } : {}),
  };
}

function isTextLanguageModel(modelData: Record<string, unknown>): boolean {
  const modalities = modelData.modalities;
  if (
    !modalities ||
    typeof modalities !== "object" ||
    Array.isArray(modalities)
  ) {
    return true;
  }
  const output = (modalities as { output?: unknown }).output;
  if (!Array.isArray(output)) {
    return true;
  }
  return output.includes("text");
}

/**
 * Builds the catalog of OpenAI language models from models.dev (`openai` provider only).
 * Cost and context window come from the same payload — no AI Gateway list call.
 */
function parseOpenAiLanguageModelsFromModelsDev(
  data: unknown,
): AvailableModel[] {
  const result: AvailableModel[] = [];
  const root = recordSchema.safeParse(data);
  if (!root.success) {
    return result;
  }

  const openaiBlock = recordSchema.safeParse(root.data.openai);
  if (!openaiBlock.success) {
    return result;
  }

  const modelsBlock = recordSchema.safeParse(openaiBlock.data.models);
  if (!modelsBlock.success) {
    return result;
  }

  for (const [modelKey, modelValue] of Object.entries(modelsBlock.data)) {
    const model = recordSchema.safeParse(modelValue);
    if (!model.success) {
      continue;
    }

    if (!isTextLanguageModel(model.data)) {
      continue;
    }

    const parsedId = z.string().safeParse(model.data.id);
    const rawId = parsedId.success ? parsedId.data : modelKey;
    const id = rawId.includes("/") ? rawId : `openai/${rawId}`;

    const nameParsed = z.string().safeParse(model.data.name);
    const name = nameParsed.success ? nameParsed.data : modelKey;

    const descriptionParsed = z
      .union([z.string(), z.null()])
      .safeParse(model.data.description);

    const parsedLimit = modelsDevLimitSchema.safeParse(model.data.limit);
    const contextWindow = parsedLimit.success
      ? parsedLimit.data.context
      : undefined;
    const cost = getModelsDevCost(model.data.cost);

    const entry: AvailableModel = {
      id,
      name,
      ...(descriptionParsed.success
        ? { description: descriptionParsed.data }
        : {}),
      modelType: "language",
      ...(typeof contextWindow === "number" && contextWindow > 0
        ? { context_window: contextWindow }
        : {}),
      ...(cost ? { cost } : {}),
    };
    result.push(entry);
  }

  result.sort((a, b) => a.id.localeCompare(b.id));
  return result;
}

async function fetchModelsDevJson(): Promise<unknown> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), MODELS_DEV_TIMEOUT_MS);

  try {
    const response = await fetch(MODELS_DEV_URL, {
      signal: controller.signal,
    });
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as unknown;
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchAvailableLanguageModels(): Promise<
  AvailableModel[]
> {
  const data = await fetchModelsDevJson();
  if (data === null) {
    return [];
  }
  const models = parseOpenAiLanguageModelsFromModelsDev(data);
  return filterDisabledModels(models);
}

export async function fetchAvailableLanguageModelsWithContext(): Promise<
  AvailableModel[]
> {
  return fetchAvailableLanguageModels();
}
