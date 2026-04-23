# Workflow Runtime Stubs (Phase 3c-1 placeholder)

This directory contains **temporary stubs** for DB-writing and web-only helpers that `chat.ts` and `chat-post-finish.ts` depend on. The purpose of this layer is to let the migrated chat workflow **compile and type-check** while Phase 3c-2 replaces each stub with a real runtime-side implementation.

**None of these stubs perform any real work.** They log their arguments and return safe default values. The workflow will start and execute, but session/chat/usage persistence, auto-commit, and auto-PR are no-ops until 3c-2 lands.

## Inventory (to be replaced in 3c-2)

| Stub | Real implementation lives at | Migration approach |
|---|---|---|
| `db-sessions.ts` | `apps/web/lib/db/sessions.ts` | Runtime needs its own Supabase admin client; reuse the same table schemas |
| `db-workflow-runs.ts` | `apps/web/lib/db/workflow-runs.ts` | Same as above — runtime-side `recordWorkflowRun` |
| `db-usage.ts` | `apps/web/lib/db/usage.ts` | Runtime-side `recordUsage` |
| `sandbox-lifecycle.ts` | `apps/web/lib/sandbox/lifecycle.ts` | Pure helpers — should move to `@open-harness/shared` once shape is stable |
| `auto-commit-direct.ts` | `apps/web/lib/chat/auto-commit-direct.ts` | Move with dependencies (GitHub token, sandbox ops) |
| `auto-pr-direct.ts` | `apps/web/lib/chat/auto-pr-direct.ts` | Same — moves with auto-commit |
| `compute-diff.ts` | `apps/web/lib/diff/compute-diff.ts` | Pure sandbox operation — move to runtime |

## Why stubs and not cutting the dependencies?

Preserving the call-graph keeps the chat workflow file **byte-identical** to the web version modulo imports. That makes 3c-2 a pure "replace implementation" step with no structural churn — easier to review, easier to verify nothing drifted.
