import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { runAgentWorkflow as RunAgentWorkflow } from "./workflows/chat.ts";
import type { sandboxLifecycleWorkflow as SandboxLifecycleWorkflow } from "./workflows/sandbox-lifecycle.ts";

type Manifest = {
  workflows: Record<string, Record<string, { workflowId: string }>>;
};

const manifestPath = resolve(
  import.meta.dir,
  ".well-known/workflow/v1/manifest.json",
);

const manifest = JSON.parse(readFileSync(manifestPath, "utf-8")) as Manifest;

function workflowStub<T>(filePath: string, exportName: string): T {
  const entry = manifest.workflows[filePath]?.[exportName];
  if (!entry) {
    throw new Error(
      `workflow not found in manifest: ${filePath}#${exportName}. Run \`bun run build:workflow\`.`,
    );
  }
  const fn = (() => {
    throw new Error(
      `workflow stub invoked directly: ${filePath}#${exportName}. Use start() from workflow/api.`,
    );
  }) as unknown as T & { workflowId: string };
  fn.workflowId = entry.workflowId;
  return fn;
}

export const runAgentWorkflow = workflowStub<typeof RunAgentWorkflow>(
  "workflows/chat.ts",
  "runAgentWorkflow",
);

export const sandboxLifecycleWorkflow = workflowStub<
  typeof SandboxLifecycleWorkflow
>("workflows/sandbox-lifecycle.ts", "sandboxLifecycleWorkflow");
