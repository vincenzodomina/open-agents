"use client";

import type { FileSuggestion } from "@/app/api/sessions/[sessionId]/files/route";
import { FileTree } from "./file-tree";

type WorkspaceFilesSidebarProps = {
  files: FileSuggestion[] | null;
  filesLoading: boolean;
  hasSandbox: boolean;
  onFileClick: (filePath: string) => void;
};

export function WorkspaceFilesSidebar({
  files,
  filesLoading,
  hasSandbox,
  onFileClick,
}: WorkspaceFilesSidebarProps) {
  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center gap-0.5 border-b border-border bg-muted/30 px-2 py-[7px]">
        <div className="rounded-md bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
          Files
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {filesLoading ? (
          <div className="flex w-full flex-col items-center gap-1.5 rounded-lg border border-dashed border-muted-foreground/25 py-8 text-center">
            <p className="text-xs text-muted-foreground">Loading files...</p>
          </div>
        ) : files && files.length > 0 ? (
          <FileTree files={files} onFileClick={onFileClick} />
        ) : (
          <div className="flex w-full flex-col items-center gap-1.5 rounded-lg border border-dashed border-muted-foreground/25 py-8 text-center">
            <p className="text-xs text-muted-foreground">
              {!hasSandbox ? "Waiting for sandbox..." : "No files found"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
