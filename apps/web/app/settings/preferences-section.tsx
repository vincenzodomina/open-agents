"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Plus, Search, X } from "lucide-react";
import { type ThemePreference, useTheme } from "@/app/providers";
import {
  DEFAULT_SANDBOX_TYPE,
  SANDBOX_OPTIONS,
  type SandboxType,
} from "@/components/sandbox-selector-compact";
import { ModelCombobox } from "@/components/model-combobox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useModelOptions } from "@/hooks/use-model-options";
import { useUserPreferences } from "@/hooks/use-user-preferences";
import {
  type ModelOption,
  getDefaultModelOptionId,
  withMissingModelOption,
} from "@/lib/model-options";

const THEME_OPTIONS: Array<{ id: ThemePreference; name: string }> = [
  { id: "system", name: "System" },
  { id: "light", name: "Light" },
  { id: "dark", name: "Dark" },
];

function isThemePreference(value: string): value is ThemePreference {
  return THEME_OPTIONS.some((option) => option.id === value);
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
      {children}
    </h3>
  );
}

export function PreferencesSectionSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <SectionHeader>General</SectionHeader>
        <div className="grid gap-6 sm:grid-cols-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
      <div className="border-t border-border/50" />
      <div className="space-y-4">
        <SectionHeader>Models</SectionHeader>
        <div className="grid gap-6 sm:grid-cols-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
        <Skeleton className="h-40 w-full" />
      </div>
    </div>
  );
}

export function PreferencesSection() {
  const { theme, setTheme } = useTheme();
  const { preferences, loading, updatePreferences } = useUserPreferences();
  const { modelOptions, loading: modelOptionsLoading } = useModelOptions();
  const [isSaving, setIsSaving] = useState(false);

  const selectedDefaultModelId =
    preferences?.defaultModelId ?? getDefaultModelOptionId(modelOptions);
  const selectedSubagentModelId = preferences?.defaultSubagentModelId ?? "auto";

  const defaultModelOptions = useMemo(
    () => withMissingModelOption(modelOptions, selectedDefaultModelId),
    [modelOptions, selectedDefaultModelId],
  );
  const subagentModelOptions = useMemo(
    () =>
      withMissingModelOption(modelOptions, preferences?.defaultSubagentModelId),
    [modelOptions, preferences?.defaultSubagentModelId],
  );
  const enabledModelIds = useMemo(
    () => new Set(preferences?.enabledModelIds),
    [preferences?.enabledModelIds],
  );

  const handleThemeChange = (nextTheme: string) => {
    if (isThemePreference(nextTheme)) {
      setTheme(nextTheme);
    }
  };

  const runPreferenceUpdate = useCallback(
    async (updates: Parameters<typeof updatePreferences>[0]) => {
      setIsSaving(true);
      try {
        await updatePreferences(updates);
      } catch (error) {
        console.error("Failed to update preferences:", error);
      } finally {
        setIsSaving(false);
      }
    },
    [updatePreferences],
  );

  const handleModelChange = async (modelId: string) => {
    await runPreferenceUpdate({ defaultModelId: modelId });
  };

  const handleSubagentModelChange = async (value: string) => {
    await runPreferenceUpdate({
      defaultSubagentModelId: value === "auto" ? null : value,
    });
  };

  const handleSandboxChange = async (sandboxType: SandboxType) => {
    await runPreferenceUpdate({ defaultSandboxType: sandboxType });
  };

  const handleAlertsEnabledChange = async (enabled: boolean) => {
    await runPreferenceUpdate({ alertsEnabled: enabled });
  };

  const handleAlertSoundEnabledChange = async (enabled: boolean) => {
    await runPreferenceUpdate({ alertSoundEnabled: enabled });
  };

  const handleAddModel = useCallback(
    async (modelId: string) => {
      const currentIds = preferences?.enabledModelIds ?? [];
      if (currentIds.includes(modelId)) {
        return;
      }

      await runPreferenceUpdate({ enabledModelIds: [...currentIds, modelId] });
    },
    [preferences?.enabledModelIds, runPreferenceUpdate],
  );

  const handleRemoveModel = useCallback(
    async (modelId: string) => {
      const currentIds = preferences?.enabledModelIds ?? [];
      await runPreferenceUpdate({
        enabledModelIds: currentIds.filter((id) => id !== modelId),
      });
    },
    [preferences?.enabledModelIds, runPreferenceUpdate],
  );

  const handleSetEnabledModels = useCallback(
    async (nextIds: string[]) => {
      await runPreferenceUpdate({ enabledModelIds: nextIds });
    },
    [runPreferenceUpdate],
  );

  if (loading) {
    return <PreferencesSectionSkeleton />;
  }

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <SectionHeader>General</SectionHeader>
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="appearance">Theme</Label>
            <Select value={theme} onValueChange={handleThemeChange}>
              <SelectTrigger id="appearance" className="w-full">
                <SelectValue placeholder="Select an appearance" />
              </SelectTrigger>
              <SelectContent>
                {THEME_OPTIONS.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Saved in your current browser.
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="sandbox">Default Sandbox</Label>
            <Select
              value={preferences?.defaultSandboxType ?? DEFAULT_SANDBOX_TYPE}
              onValueChange={(value) =>
                handleSandboxChange(value as SandboxType)
              }
              disabled={isSaving}
            >
              <SelectTrigger id="sandbox" className="w-full">
                <SelectValue placeholder="Select a sandbox type" />
              </SelectTrigger>
              <SelectContent>
                {SANDBOX_OPTIONS.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between gap-4 rounded-lg border border-border/60 p-4">
            <div className="space-y-0.5">
              <Label htmlFor="alerts-enabled">Alerts</Label>
              <p className="text-xs text-muted-foreground">
                Notify when a background agent finishes.
              </p>
            </div>
            <Switch
              id="alerts-enabled"
              checked={preferences?.alertsEnabled ?? true}
              onCheckedChange={handleAlertsEnabledChange}
              disabled={isSaving}
            />
          </div>

          <div className="flex items-center justify-between gap-4 rounded-lg border border-border/60 p-4">
            <div className="space-y-0.5">
              <Label htmlFor="alert-sound-enabled">Alert sound</Label>
              <p className="text-xs text-muted-foreground">
                Play a sound together with alerts.
              </p>
            </div>
            <Switch
              id="alert-sound-enabled"
              checked={preferences?.alertSoundEnabled ?? true}
              onCheckedChange={handleAlertSoundEnabledChange}
              disabled={isSaving || !(preferences?.alertsEnabled ?? true)}
            />
          </div>
        </div>
      </div>

      <div className="border-t border-border/50" />

      <div className="space-y-4">
        <SectionHeader>Models</SectionHeader>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="model">Default Model</Label>
            <ModelCombobox
              value={selectedDefaultModelId}
              items={defaultModelOptions.map((option) => ({
                id: option.id,
                label: option.label,
                description: option.description,
                isVariant: option.isVariant,
              }))}
              placeholder="Select a model"
              searchPlaceholder="Search models..."
              emptyText={
                modelOptionsLoading ? "Loading..." : "No models found."
              }
              disabled={isSaving || modelOptionsLoading}
              onChange={handleModelChange}
            />
            <p className="text-xs text-muted-foreground">Used for new chats.</p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="subagent-model">Subagent Model</Label>
            <ModelCombobox
              value={selectedSubagentModelId}
              items={[
                { id: "auto", label: "Same as main model" },
                ...subagentModelOptions.map((option) => ({
                  id: option.id,
                  label: option.label,
                  description: option.description,
                  isVariant: option.isVariant,
                })),
              ]}
              placeholder="Select a model"
              searchPlaceholder="Search models..."
              emptyText={
                modelOptionsLoading ? "Loading..." : "No models found."
              }
              disabled={isSaving || modelOptionsLoading}
              onChange={handleSubagentModelChange}
            />
            <p className="text-xs text-muted-foreground">
              Used for supporting subagents.
            </p>
          </div>
        </div>

        <EnabledModelsSection
          modelOptions={modelOptions}
          modelOptionsLoading={modelOptionsLoading}
          enabledModelIds={enabledModelIds}
          onAddModel={handleAddModel}
          onRemoveModel={handleRemoveModel}
          onSetEnabledModels={handleSetEnabledModels}
          disabled={isSaving}
        />
      </div>
    </div>
  );
}

function EnabledModelsSection({
  modelOptions,
  modelOptionsLoading,
  enabledModelIds,
  onAddModel,
  onRemoveModel,
  onSetEnabledModels,
  disabled,
}: {
  modelOptions: ModelOption[];
  modelOptionsLoading: boolean;
  enabledModelIds: Set<string>;
  onAddModel: (modelId: string) => void;
  onRemoveModel: (modelId: string) => void;
  onSetEnabledModels: (ids: string[]) => void;
  disabled: boolean;
}) {
  const [search, setSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const enabledCount = enabledModelIds.size;

  const enabledOptions = useMemo(
    () => modelOptions.filter((option) => enabledModelIds.has(option.id)),
    [modelOptions, enabledModelIds],
  );

  const availableOptions = useMemo(() => {
    const opts = modelOptions.filter(
      (option) => !enabledModelIds.has(option.id),
    );
    if (!search.trim()) return opts;
    const lower = search.toLowerCase();
    return opts.filter(
      (option) =>
        option.label.toLowerCase().includes(lower) ||
        option.id.toLowerCase().includes(lower) ||
        (option.description?.toLowerCase().includes(lower) ?? false),
    );
  }, [modelOptions, enabledModelIds, search]);

  const handleDeselectAll = () => {
    onSetEnabledModels([]);
  };

  const handleAdd = (modelId: string) => {
    onAddModel(modelId);
    setSearch("");
    inputRef.current?.focus();
  };

  if (modelOptionsLoading) {
    return (
      <div className="grid gap-2">
        <Label>Custom Model Set</Label>
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <Label>Custom Model Set</Label>
          {enabledCount > 0 && (
            <button
              type="button"
              disabled={disabled}
              onClick={handleDeselectAll}
              className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline disabled:pointer-events-none disabled:opacity-40"
            >
              Clear all
            </button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {enabledCount === 0
            ? "By default, every available model is shown in the model selector. Add models here to create a shortlist of just the ones you use."
            : `The model selector will only show ${enabledCount === 1 ? "this model" : `these ${enabledCount} models`}. Remove all to go back to showing every model.`}
        </p>
      </div>

      {enabledOptions.length > 0 && (
        <div className="divide-y divide-border/60 rounded-lg border border-border/70">
          {enabledOptions.map((option) => (
            <div key={option.id} className="flex items-center gap-3 px-3 py-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium">
                    {option.label}
                  </span>
                  {option.isVariant && (
                    <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">
                      variant
                    </span>
                  )}
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {option.id}
                </p>
              </div>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onRemoveModel(option.id)}
                className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-60"
                aria-label={`Remove ${option.label}`}
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="relative">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setDropdownOpen(true);
            }}
            onFocus={() => setDropdownOpen(true)}
            placeholder="Search to add a model..."
            disabled={disabled}
            className="pl-9"
          />
        </div>
        {dropdownOpen && (
          <>
            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- backdrop dismiss */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => {
                setDropdownOpen(false);
                setSearch("");
              }}
            />
            <div className="absolute z-20 mt-1 w-full rounded-lg border border-border bg-popover shadow-md">
              <div className="max-h-60 overflow-y-auto">
                {availableOptions.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    {search.trim()
                      ? "No matching models."
                      : "All models have been added."}
                  </p>
                ) : (
                  availableOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handleAdd(option.id)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-muted/50"
                    >
                      <Plus className="size-3.5 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-medium">
                            {option.label}
                          </span>
                          {option.isVariant && (
                            <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">
                              variant
                            </span>
                          )}
                        </div>
                        <p className="truncate text-xs text-muted-foreground">
                          {option.description ?? option.id}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
