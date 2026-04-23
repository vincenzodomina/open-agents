# Workflow Runtime

The detached service that hosts **durable workflows** for the open-harness agent. Built on Nitro v3 + Vercel's `workflow` SDK, with `@workflow/world-postgres` pointed at Supabase for self-hosted deployments (falls through to Vercel World automatically on Vercel).

This is the second of two runtime services:
- **`apps/runtime`** (Bun) — lightweight, stateless LLM calls (`/generate-title`, `/generate-commit-message`, `/transcribe`).
- **`apps/workflow-runtime`** (this app, Node + Nitro) — durable workflow-backed endpoints (`/chat/*` after Phase 3c migration).

## Why two runtimes

See [docs/plans/workflow-durability-migration.md](../../docs/plans/workflow-durability-migration.md) for the full rationale. Short version: the Bun runtime handles LLM calls that don't need durability. This one handles the chat workflow, which needs step replay and survive-a-crash semantics from `@workflow/world-postgres`. Stack split during migration reduces risk; consolidation later is possible if the ops cost hurts.

## Running

```bash
# Self-hosted: point at any Postgres (local Supabase shown)
export WORKFLOW_TARGET_WORLD="@workflow/world-postgres"
export WORKFLOW_POSTGRES_URL="postgres://postgres:postgres@127.0.0.1:54322/postgres"
# Supabase validates bearer tokens on auth'd endpoints
export NEXT_PUBLIC_SUPABASE_URL="..."
export NEXT_PUBLIC_SUPABASE_ANON_KEY="..."

# One-time: create workflow tables in the Postgres instance
bun run --cwd apps/workflow-runtime setup-pg

# Dev
bun run --cwd apps/workflow-runtime dev

# Prod
bun run --cwd apps/workflow-runtime build
bun run --cwd apps/workflow-runtime start
```

On Vercel deployments, leave `WORKFLOW_TARGET_WORLD` unset — the SDK auto-detects Vercel World and uses the hosted queue + storage. The same workflow code paths compile for both.

## Endpoints

- `GET /api/health` — liveness, no auth
- `POST /api/count` `{ target?: number }` — starts a `countToN` workflow (auth required). Smoke test for the durability stack; remove once chat is production-ready.
- `GET /api/runs/:id` — returns run status (auth required)
- `POST /api/chat/start` — starts the chat workflow (`runAgentWorkflow`). Body is the `Options` shape from `server/workflows/chat.ts`. Returns `{ runId }`. Phase 3c-1 skeleton: the workflow body compiles against `server/workflows/stubs/*` so DB writes are no-ops. Phase 3c-2 replaces stubs with real runtime-side implementations.
- `POST /api/chat/runs/:id/stop` — cancels a chat workflow run (auth required).
- *(coming in 3c-2)* `GET /api/chat/runs/:id/stream` — resume streaming from a running workflow via `run.getReadable()`.

See `server/workflows/stubs/README.md` for the current inventory of stubs and what moves in 3c-2.

## Auth contract

Same bearer-token contract as `apps/runtime`: every non-health route requires `Authorization: Bearer <supabase access token>`. Validated via `supabase.auth.getUser(token)` through `@open-harness/runtime-core/bearer-auth`.

## Durability across restart

Confirmed: SIGKILL mid-run, restart — new process logs `[world-postgres] Re-enqueued N active run(s) on startup` and resumes. This is the whole point of the service; test it before trusting it with chat.

## Rollup tree-shake note

`nitro.config.ts` includes a `moduleSideEffects` override because neither `workflow` nor `@workflow/core` declare `sideEffects: true`. Without it, rollup dead-code-eliminates `registerStepFunction(...)` calls from the generated `.nitro/workflow/steps.mjs`, and steps fail with `StepNotRegisteredError` at runtime. Don't remove the override until upstream publishes the marker.
