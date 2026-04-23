# Workflow Runtime DB + Helpers

Runtime-side implementations of the helpers the chat workflow uses. All seven modules are now real — directory was originally `stubs/` during Phase 3c-1 scaffolding.

## Inventory

| File | Notes |
|---|---|
| `db-sessions.ts` | Supabase admin queries for the 11 functions chat + pr-content need; matches `apps/web/lib/db/sessions.ts` for those specific operations |
| `db-workflow-runs.ts` | Verbatim port — calls `record_workflow_run` RPC |
| `db-usage.ts` | Verbatim port — inserts into `usage_events` |
| `sandbox-lifecycle.ts` | Activity + active-update builders; minimal port of `apps/web/lib/sandbox/lifecycle.ts` |
| `compute-diff.ts` | Wraps shared `@open-harness/shared/lib/diff/compute-diff` with runtime's `updateSession` |
| `auto-commit-direct.ts` | Near-verbatim port — sandbox git ops + LLM-generated commit message + GitHub App co-author trailer |
| `auto-pr-direct.ts` | Near-verbatim port — pr-content generation + Octokit-backed create/find PR calls |

## Shared-vs-duplicated split

Pure helpers live in `@open-harness/shared` (crypto, repo-identifiers, chat-types, dedupe-message-reasoning, workflow-run-types, diff/*). DB-coupled and Octokit-coupled helpers live here in runtime — both the web runtime and this workflow runtime need their own admin-client-backed implementations because Supabase's service-role client is environment-specific.
