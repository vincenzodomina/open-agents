"use client";

import { Loader2, Monitor } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useUserPreferences } from "@/hooks/use-user-preferences";
import { cn } from "@/lib/utils";
import {
  DEFAULT_SANDBOX_TYPE,
  SANDBOX_OPTIONS,
  type SandboxType,
} from "./sandbox-selector-compact";

interface SessionStarterProps {
  onSubmit: (session: { sandboxType: SandboxType }) => void;
  isLoading?: boolean;
}

export function SessionStarter({
  onSubmit,
  isLoading = false,
}: SessionStarterProps) {
  const { preferences, loading: preferencesLoading } = useUserPreferences();
  const [sandboxType, setSandboxType] =
    useState<SandboxType>(DEFAULT_SANDBOX_TYPE);

  useEffect(() => {
    if (!preferences?.defaultSandboxType) {
      return;
    }

    setSandboxType(preferences.defaultSandboxType);
  }, [preferences?.defaultSandboxType]);

  const controlsDisabled = isLoading || preferencesLoading;
  const selectedSandbox =
    SANDBOX_OPTIONS.find((option) => option.id === sandboxType) ??
    SANDBOX_OPTIONS[0];

  return (
    <div className="w-full min-w-0 max-w-2xl overflow-hidden rounded-xl border border-border/70 bg-card/80 p-4 shadow-sm backdrop-blur supports-backdrop-filter:bg-card/75 dark:border-white/10 dark:bg-neutral-900/60 dark:shadow-none sm:p-5">
      <div className="flex flex-col gap-5">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">
            Start a new session
          </h2>
          <p className="text-sm text-muted-foreground">
            Launch a fresh sandbox and start chatting with the agent right away.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {SANDBOX_OPTIONS.map((option) => {
            const isSelected = option.id === sandboxType;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setSandboxType(option.id)}
                disabled={controlsDisabled}
                className={cn(
                  "rounded-xl border px-4 py-4 text-left transition-colors",
                  isSelected
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-background/60 text-foreground hover:bg-muted/50",
                  controlsDisabled && "cursor-not-allowed opacity-70",
                )}
              >
                <div className="flex items-center gap-2">
                  <Monitor className="h-4 w-4" />
                  <span className="text-sm font-medium">{option.name}</span>
                </div>
                <p
                  className={cn(
                    "mt-2 text-xs",
                    isSelected ? "text-background/80" : "text-muted-foreground",
                  )}
                >
                  {option.description}
                </p>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => onSubmit({ sandboxType })}
          disabled={controlsDisabled}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
            controlsDisabled
              ? "cursor-not-allowed bg-muted text-muted-foreground"
              : "bg-foreground text-background hover:bg-foreground/90",
          )}
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isLoading ? "Creating session…" : "Start session"}
        </button>

        <p className="text-center text-xs text-muted-foreground">
          Using {selectedSandbox.name} by default{" "}
          <span className="text-muted-foreground/60">&middot;</span>{" "}
          <Link
            href="/settings/preferences"
            className="text-muted-foreground underline decoration-muted-foreground/40 underline-offset-2 transition-colors hover:text-foreground hover:decoration-foreground/40"
          >
            Change
          </Link>
        </p>
      </div>
    </div>
  );
}
