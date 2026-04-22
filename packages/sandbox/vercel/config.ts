import type { SandboxHooks } from "../interface";

export interface VercelSandboxConfig {
  /**
   * Optional persistent sandbox name.
   * When provided, repeated creates are expected to target the same durable sandbox.
   */
  name?: string;
  /**
   * Optional snapshot ID to restore this sandbox from.
   * Used only for legacy snapshot-backed session migration.
   */
  restoreSnapshotId?: string;
  /**
   * Environment variables to make available to all commands in the sandbox.
   * Useful for API keys and other secrets that must exist inside the sandbox.
   */
  env?: Record<string, string>;
  /**
   * Number of vCPUs (1-8). Each vCPU provides 2048 MB of memory.
   * @default 4
   */
  vcpus?: number;
  /**
   * Sandbox timeout in milliseconds.
   * @default 300_000 (5 minutes)
   */
  timeout?: number;
  /**
   * Runtime environment.
   * @default "node22"
   */
  runtime?: "node22" | "node24" | "python3.13";
  /**
   * Ports to expose from the sandbox.
   */
  ports?: number[];
  /**
   * Optional snapshot ID to use as the base image for new sandboxes.
   * When provided, the sandbox is created from this snapshot first.
   */
  baseSnapshotId?: string;
  /**
   * Whether the sandbox should automatically persist filesystem state between sessions.
   * @default true
   */
  persistent?: boolean;
  /**
   * Default expiration for automatically created snapshots in milliseconds.
   * Use `0` to retain snapshots indefinitely.
   */
  snapshotExpiration?: number;
  /**
   * Lifecycle hooks for setup and teardown.
   * afterStart is called after the sandbox is created and configured.
   * beforeStop is called before the sandbox is stopped.
   */
  hooks?: SandboxHooks;
}

/**
 * Configuration for reconnecting to an existing persistent sandbox.
 */
export interface VercelSandboxConnectConfig {
  /** The persistent sandbox name to reconnect to */
  sandboxName: string;
  /** Environment variables to make available to commands */
  env?: Record<string, string>;
  /** Lifecycle hooks for setup and teardown */
  hooks?: SandboxHooks;
  /**
   * Remaining timeout in milliseconds for the current session.
   * When omitted, it is derived from the live session metadata when possible.
   */
  remainingTimeout?: number;
  /** Ports that were declared at creation time (for preview URL display) */
  ports?: number[];
  /** Whether a stopped sandbox should be explicitly resumed */
  resume?: boolean;
}
