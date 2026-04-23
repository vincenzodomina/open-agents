import type { Dirent } from "node:fs";
import { posix } from "node:path";
import { connectSandbox } from "@open-harness/sandbox";
import {
  requireAuthenticatedUser,
  requireOwnedSessionWithSandboxGuard,
} from "@/app/api/sessions/_lib/session-context";
import { updateSession } from "@/lib/db/sessions";
import { buildHibernatedLifecycleUpdate } from "@/lib/sandbox/lifecycle";
import {
  clearUnavailableSandboxState,
  isSandboxUnavailableError,
  isSessionSandboxOperational,
} from "@/lib/sandbox/utils";

export type FileSuggestion = {
  value: string;
  display: string;
  isDirectory: boolean;
};

export type FilesResponse = {
  files: FileSuggestion[];
};

type RouteContext = {
  params: Promise<{ sessionId: string }>;
};

const MAX_FILE_SUGGESTIONS = 5000;
const SKIPPED_DIRECTORY_NAMES = new Set([
  ".git",
  ".next",
  ".turbo",
  "node_modules",
]);

function getPathDepth(suggestion: FileSuggestion): number {
  const normalizedPath = suggestion.isDirectory
    ? suggestion.value.slice(0, -1)
    : suggestion.value;
  return normalizedPath ? normalizedPath.split("/").length : 0;
}

type FileListingSandbox = {
  workingDirectory: string;
  readdir(path: string, options: { withFileTypes: true }): Promise<Dirent[]>;
};

function sortSuggestionsByDepth(
  suggestions: FileSuggestion[],
): FileSuggestion[] {
  return suggestions.sort((a, b) => {
    const depthDiff = getPathDepth(a) - getPathDepth(b);
    if (depthDiff !== 0) return depthDiff;
    return a.display.localeCompare(b.display);
  });
}

function isSkippableTraversalError(message: string): boolean {
  const normalizedMessage = message.toLowerCase();
  return (
    normalizedMessage.includes("enoent") ||
    normalizedMessage.includes("enotdir") ||
    normalizedMessage.includes("no such file") ||
    normalizedMessage.includes("not found")
  );
}

function toSuggestion(
  relativePath: string,
  isDirectory: boolean,
): FileSuggestion {
  const display = isDirectory ? `${relativePath}/` : relativePath;
  return {
    value: display,
    display,
    isDirectory,
  };
}

async function listWorkspaceFiles(
  sandbox: FileListingSandbox,
): Promise<FileSuggestion[]> {
  const rootDir = sandbox.workingDirectory;
  const results: FileSuggestion[] = [];
  const queue = [rootDir];
  const seenDirs = new Set<string>([rootDir]);

  while (queue.length > 0 && results.length < MAX_FILE_SUGGESTIONS) {
    const currentDir = queue.shift();
    if (!currentDir) {
      break;
    }

    let entries: Dirent[];
    try {
      entries = await sandbox.readdir(currentDir, { withFileTypes: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (isSandboxUnavailableError(message)) {
        throw error;
      }
      if (currentDir !== rootDir && isSkippableTraversalError(message)) {
        continue;
      }
      throw error;
    }

    const sortedEntries = [...entries].sort((a, b) =>
      a.name.localeCompare(b.name),
    );

    for (const entry of sortedEntries) {
      if (results.length >= MAX_FILE_SUGGESTIONS) {
        break;
      }

      const childPath = posix.join(currentDir, entry.name);
      const relativePath = posix.relative(rootDir, childPath);
      if (
        !relativePath ||
        relativePath === "." ||
        relativePath.startsWith("../")
      ) {
        continue;
      }

      if (entry.isDirectory()) {
        if (SKIPPED_DIRECTORY_NAMES.has(entry.name)) {
          continue;
        }

        results.push(toSuggestion(relativePath, true));
        if (!seenDirs.has(childPath)) {
          seenDirs.add(childPath);
          queue.push(childPath);
        }
        continue;
      }

      if (entry.isSymbolicLink() || !entry.isFile()) {
        continue;
      }

      results.push(toSuggestion(relativePath, false));
    }
  }

  return sortSuggestionsByDepth(results);
}

export async function GET(_req: Request, context: RouteContext) {
  const authResult = await requireAuthenticatedUser();
  if (!authResult.ok) {
    return authResult.response;
  }

  const { sessionId } = await context.params;

  const sessionContext = await requireOwnedSessionWithSandboxGuard({
    userId: authResult.userId,
    sessionId,
    sandboxGuard: isSessionSandboxOperational,
    sandboxErrorMessage: "Sandbox not initialized",
  });
  if (!sessionContext.ok) {
    return sessionContext.response;
  }

  const { sessionRecord } = sessionContext;
  const sandboxState = sessionRecord.sandboxState;
  if (!sandboxState) {
    return Response.json({ error: "Sandbox not initialized" }, { status: 400 });
  }

  try {
    const sandbox = await connectSandbox(sandboxState);
    const files = await listWorkspaceFiles(sandbox);

    const response: FilesResponse = {
      files,
    };

    return Response.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (isSandboxUnavailableError(message)) {
      await updateSession(sessionId, {
        sandboxState: clearUnavailableSandboxState(
          sessionRecord.sandboxState,
          message,
        ),
        ...buildHibernatedLifecycleUpdate(),
      });
      return Response.json(
        { error: "Sandbox is unavailable. Please resume sandbox." },
        { status: 409 },
      );
    }
    console.error("Failed to list files:", error);
    return Response.json(
      { error: "Failed to list files from the sandbox workspace." },
      { status: 500 },
    );
  }
}
