export const SUBAGENT_DESCRIPTIONS = {
  explorer:
    "Use for read-only codebase exploration, tracing behavior, and answering questions without changing files",
  executor:
    "Use for well-scoped implementation work, including edits, scaffolding, refactors, and other file changes",
  design:
    "Use for creating distinctive, production-grade frontend interfaces with high design quality. Generates creative, polished code that avoids generic AI aesthetics.",
} as const;

export const SUBAGENT_TYPES = Object.keys(SUBAGENT_DESCRIPTIONS) as [
  keyof typeof SUBAGENT_DESCRIPTIONS,
  ...(keyof typeof SUBAGENT_DESCRIPTIONS)[],
];

export type SubagentType = keyof typeof SUBAGENT_DESCRIPTIONS;

export type SubagentInstance =
  | typeof import("./design").designSubagent
  | typeof import("./executor").executorSubagent
  | typeof import("./explorer").explorerSubagent;

export function buildSubagentSummaryLines(): string {
  return SUBAGENT_TYPES.map((type) => {
    return `- \`${type}\` - ${SUBAGENT_DESCRIPTIONS[type]}`;
  }).join("\n");
}

export async function getSubagent(
  type: SubagentType,
): Promise<SubagentInstance> {
  switch (type) {
    case "design":
      return (await import("./design")).designSubagent;
    case "executor":
      return (await import("./executor")).executorSubagent;
    case "explorer":
      return (await import("./explorer")).explorerSubagent;
  }
}
