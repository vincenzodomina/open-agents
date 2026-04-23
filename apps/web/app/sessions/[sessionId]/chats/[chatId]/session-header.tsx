"use client";

import { PanelLeft } from "lucide-react";
import { useCallback, useEffect } from "react";
import { useSessionLayout } from "@/app/sessions/[sessionId]/session-layout-context";
import { FolderIcon, FolderOpenIcon } from "@/components/file-type-icons";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useWorkspacePanel } from "./workspace-panel-context";

/**
 * Session header that uses only layout-level data (persists across chat switches).
 * Sandbox-specific props are removed to prevent layout shift during navigation.
 */
export function SessionHeader() {
  const { toggleSidebar } = useSidebar();
  const { session } = useSessionLayout();
  const { panelOpen, togglePanel } = useWorkspacePanel();

  const handlePanelToggle = useCallback(() => {
    togglePanel();
  }, [togglePanel]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isPanelShortcut =
        event.code === "KeyB" &&
        (event.metaKey || event.ctrlKey) &&
        event.shiftKey &&
        !event.altKey;

      if (!isPanelShortcut || event.repeat) {
        return;
      }

      event.preventDefault();
      handlePanelToggle();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlePanelToggle]);

  const FilesIcon = panelOpen ? FolderOpenIcon : FolderIcon;

  return (
    <header className="border-b border-border px-3 py-1.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={toggleSidebar}
              >
                <PanelLeft className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Toggle left sidebar</TooltipContent>
          </Tooltip>

          <div className="flex min-w-0 items-center gap-1.5 text-sm">
            <span className="truncate font-medium text-foreground sm:font-normal sm:text-muted-foreground">
              {session.title}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-7 w-7 shrink-0",
                  panelOpen && "bg-accent text-accent-foreground",
                )}
                onClick={handlePanelToggle}
              >
                <FilesIcon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              Files · ⌘⇧B / Ctrl+Shift+B
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </header>
  );
}
