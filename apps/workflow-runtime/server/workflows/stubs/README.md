# Workflow Runtime DB + Helpers (Phase 3c-2)

Replacement target for the chat workflow's `@/lib/*` dependencies. Originally named `stubs/` during 3c-1 scaffolding; now holds a mix of real implementations (plumbing) and remaining stubs (product features).

## Status

| File | Status | Source of truth |
|---|---|---|
| `db-sessions.ts` | **Real** — uses `getSupabaseAdmin()` from `../../utils/supabase-admin` | Mirrors `apps/web/lib/db/sessions.ts` for the 8 functions the chat workflow needs |
| `db-workflow-runs.ts` | **Real** — calls `record_workflow_run` RPC | Verbatim port of `apps/web/lib/db/workflow-runs.ts` |
| `db-usage.ts` | **Real** — inserts into `usage_events` | Verbatim port of `apps/web/lib/db/usage.ts#recordUsage` |
| `sandbox-lifecycle.ts` | **Real** — pure helpers | Minimal port of `apps/web/lib/sandbox/lifecycle.ts` (activity + active update builders only) |
| `auto-commit-direct.ts` | **Real** — uses runtime-side GitHub helpers and shared `buildGitHubAuthRemoteUrl` | Near-verbatim port of `apps/web/lib/chat/auto-commit-direct.ts` |
| `auto-pr-direct.ts` | Stub | `apps/web/lib/chat/auto-pr-direct.ts` — Octokit + PR content generation; deferred (larger surface) |
| `compute-diff.ts` | **Real** — wraps shared `@open-harness/shared/lib/diff/compute-diff` with runtime's `updateSession` | — |

The three remaining stubs log calls and return safe defaults. The chat workflow runs end-to-end against them: the agent generates output, messages persist, usage gets tracked, workflow runs are recorded — only auto-commit, auto-PR, and diff caching no-op until 3c-2b.

## Rename of the directory

Postponed until 3c-2b lands all real implementations. At that point, `stubs/` moves to something like `impl/` with a single import update in `chat-post-finish.ts`.
