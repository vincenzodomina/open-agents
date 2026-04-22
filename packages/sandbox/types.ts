/**
 * File entry representing a file, directory, or symlink in the sandbox filesystem.
 * Used for serialization/deserialization of sandbox state.
 */
export interface FileEntry {
  type: "file" | "directory" | "symlink";
  /** File content (UTF-8 text or base64 for binary) */
  content?: string;
  /** Set to "base64" for binary files */
  encoding?: "base64";
  /** File permissions */
  mode?: number;
  /** Symlink target path */
  target?: string;
}

/**
 * Status of a sandbox throughout its lifecycle.
 * Used for UI feedback and state management.
 */
export type SandboxStatus =
  | "starting" // Creating new sandbox
  | "restoring" // Restoring from saved state (files or snapshot)
  | "reconnecting" // Reconnecting to existing VM
  | "ready" // Fully usable
  | "stopping" // Shutting down
  | "stopped"; // Terminated
