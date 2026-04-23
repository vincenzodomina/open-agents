// Phase 3c-1 stub. See ./README.md.
export interface AutoCreatePrResult {
  created: boolean;
  syncedExisting: boolean;
  skipped: boolean;
  skipReason?: string;
  prNumber?: number;
  prUrl?: string;
  error?: string;
}

export async function performAutoCreatePr(
  _args: unknown,
): Promise<AutoCreatePrResult> {
  console.warn("[workflow-runtime/stub] performAutoCreatePr()");
  return { created: false, syncedExisting: false, skipped: true };
}
