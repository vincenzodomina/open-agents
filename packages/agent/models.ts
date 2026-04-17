import { createOpenAI } from "@ai-sdk/openai";
import {
  defaultSettingsMiddleware,
  wrapLanguageModel,
  type JSONValue,
  type LanguageModel,
} from "ai";
import type { OpenAIResponsesProviderOptions } from "@ai-sdk/openai";

function isJsonObject(value: unknown): value is Record<string, JSONValue> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toProviderOptionsRecord(
  options: Record<string, unknown>,
): Record<string, JSONValue> {
  return options as Record<string, JSONValue>;
}

function mergeRecords(
  base: Record<string, JSONValue>,
  override: Record<string, JSONValue>,
): Record<string, JSONValue> {
  const merged: Record<string, JSONValue> = { ...base };

  for (const [key, value] of Object.entries(override)) {
    const existingValue = merged[key];

    if (isJsonObject(existingValue) && isJsonObject(value)) {
      merged[key] = mergeRecords(existingValue, value);
      continue;
    }

    merged[key] = value;
  }

  return merged;
}

export type ProviderOptionsByProvider = Record<
  string,
  Record<string, JSONValue>
>;

export function mergeProviderOptions(
  defaults: ProviderOptionsByProvider,
  overrides?: ProviderOptionsByProvider,
): ProviderOptionsByProvider {
  if (!overrides || Object.keys(overrides).length === 0) {
    return defaults;
  }

  const merged: ProviderOptionsByProvider = { ...defaults };

  for (const [provider, providerOverrides] of Object.entries(overrides)) {
    const providerDefaults = merged[provider];

    if (!providerDefaults) {
      merged[provider] = providerOverrides;
      continue;
    }

    merged[provider] = mergeRecords(providerDefaults, providerOverrides);
  }

  return merged;
}

export interface ModelOptions {
  providerOptionsOverrides?: ProviderOptionsByProvider;
}

export type { LanguageModel, JSONValue };

/** Canonical model ids are `openai/<apiModelId>` (e.g. `openai/gpt-5.4`). */
export type OpenAIAppModelId = `${"openai/"}${string}`;

let openaiProvider: ReturnType<typeof createOpenAI> | undefined;

function getOpenAIProvider(): ReturnType<typeof createOpenAI> {
  if (openaiProvider) {
    return openaiProvider;
  }
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required");
  }
  openaiProvider = createOpenAI({
    apiKey,
    ...(process.env.OPENAI_BASE_URL
      ? { baseURL: process.env.OPENAI_BASE_URL }
      : {}),
  });
  return openaiProvider;
}

export function shouldApplyOpenAIReasoningDefaults(modelId: string): boolean {
  return modelId.startsWith("openai/gpt-5");
}

function shouldApplyOpenAITextVerbosityDefaults(modelId: string): boolean {
  return modelId.startsWith("openai/gpt-5.4");
}

export function getProviderOptionsForModel(
  modelId: string,
  providerOptionsOverrides?: ProviderOptionsByProvider,
): ProviderOptionsByProvider {
  const defaultProviderOptions: ProviderOptionsByProvider = {};

  if (modelId.startsWith("openai/")) {
    defaultProviderOptions.openai = toProviderOptionsRecord({
      store: false,
    } satisfies OpenAIResponsesProviderOptions);
  }

  if (shouldApplyOpenAIReasoningDefaults(modelId)) {
    defaultProviderOptions.openai = mergeRecords(
      defaultProviderOptions.openai ?? {},
      toProviderOptionsRecord({
        reasoningSummary: "detailed",
        include: ["reasoning.encrypted_content"],
      } satisfies OpenAIResponsesProviderOptions),
    );
  }

  if (shouldApplyOpenAITextVerbosityDefaults(modelId)) {
    defaultProviderOptions.openai = mergeRecords(
      defaultProviderOptions.openai ?? {},
      toProviderOptionsRecord({
        textVerbosity: "low",
      } satisfies OpenAIResponsesProviderOptions),
    );
  }

  const providerOptions = mergeProviderOptions(
    defaultProviderOptions,
    providerOptionsOverrides,
  );

  if (modelId.startsWith("openai/")) {
    providerOptions.openai = mergeRecords(
      providerOptions.openai ?? {},
      toProviderOptionsRecord({
        store: false,
      } satisfies OpenAIResponsesProviderOptions),
    );
  }

  return providerOptions;
}

/**
 * Resolves a language model for OpenAI (`openai/<id>`) using `@ai-sdk/openai`.
 */
export function gateway(
  modelId: OpenAIAppModelId | string,
  options: ModelOptions = {},
): LanguageModel {
  const { providerOptionsOverrides } = options;

  if (!modelId.startsWith("openai/")) {
    throw new Error(
      `Only OpenAI models are supported (openai/...), got: ${modelId}`,
    );
  }

  const openaiModelId = modelId.slice("openai/".length);
  const provider = getOpenAIProvider();
  let model: LanguageModel = provider(openaiModelId);

  const providerOptions = getProviderOptionsForModel(
    modelId,
    providerOptionsOverrides,
  );

  if (Object.keys(providerOptions).length > 0) {
    model = wrapLanguageModel({
      model,
      middleware: defaultSettingsMiddleware({
        settings: { providerOptions },
      }),
    });
  }

  return model;
}
