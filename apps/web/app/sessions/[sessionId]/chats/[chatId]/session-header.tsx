"use client";

import { Link2, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSessionLayout } from "@/app/sessions/[sessionId]/session-layout-context";
import { useSidebar } from "@/components/ui/sidebar";
import { useChatLayout } from "./chat-layout-context";

/**
 * Session header that uses only layout-level data (persists across chat switches).
 * Sandbox-specific props are removed to prevent layout shift during navigation.
 */
export function SessionHeader() {
  const { toggleSidebar } = useSidebar();
  const { setShareRequested, headerActionsRef } = useChatLayout();
  const { session } = useSessionLayout();

  return (
    <header className="border-b border-border px-3 py-1.5">
      <div className="flex items-center justify-between gap-2">
        {/* Left side: panel toggle + title */}
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

            {/* Share link icon */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setShareRequested(true)}
                  className="ml-1 rounded p-1 text-muted-foreground/60 transition-colors hover:text-foreground"
                >
                  <Link2 className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Share chat</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Right side: dev server / code editor actions */}
        <div className="flex items-center gap-1">
          <div ref={headerActionsRef} className="flex items-center" />
        </div>
      </div>
    </header>
  );
}
