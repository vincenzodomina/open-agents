import type { Sandbox } from "../interface";

const active = new Map<string, Sandbox>();
const dormantRoots = new Map<string, string>();

export function getActiveJustBashSandbox(name: string): Sandbox | undefined {
  return active.get(name);
}

export function registerActiveJustBashSandbox(
  name: string,
  sandbox: Sandbox,
): void {
  active.set(name, sandbox);
}

export function unregisterActiveJustBashSandbox(name: string): void {
  active.delete(name);
}

export function getDormantWorkspaceRoot(name: string): string | undefined {
  return dormantRoots.get(name);
}

export function setDormantWorkspaceRoot(name: string, rootPath: string): void {
  dormantRoots.set(name, rootPath);
}

export function takeDormantWorkspaceRoot(name: string): string | undefined {
  const path = dormantRoots.get(name);
  if (path === undefined) {
    return undefined;
  }
  dormantRoots.delete(name);
  return path;
}
