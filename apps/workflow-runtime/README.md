# Workflow Runtime

Detached service hosting durable workflows (chat, sandbox-lifecycle). Nitro v3 + Vercel `workflow` SDK, with `@workflow/world-postgres` pointed at Supabase for self-hosted deployments. Vercel deployments auto-detect the hosted world.

Pairs with `apps/runtime` (Bun, lightweight LLM calls): this service owns everything that needs step replay and survive-a-crash semantics.

## Running

```bash
export WORKFLOW_TARGET_WORLD="@workflow/world-postgres"
export WORKFLOW_POSTGRES_URL="postgres://postgres:postgres@127.0.0.1:54322/postgres"
export NEXT_PUBLIC_SUPABASE_URL="..."
export NEXT_PUBLIC_SUPABASE_ANON_KEY="..."

bun run --cwd apps/workflow-runtime setup-pg   # one-time: create workflow tables
bun run --cwd apps/workflow-runtime dev
```

Leave `WORKFLOW_TARGET_WORLD` unset on Vercel — the SDK auto-detects the hosted world.

## Endpoints

- `GET /api/health` — liveness, no auth
- `GET /api/runs/:id` — run status (auth required)
- `POST /api/chat/start` — starts a chat workflow run. Returns `{ runId }`.
- `GET /api/chat/runs/:id/stream` — resume a chat stream via `run.getReadable()`.
- `POST /api/chat/runs/:id/stop` — cancels a chat run.
- `POST /api/sandbox/lifecycle/kick` — enqueues a sandbox-lifecycle evaluation.

## Auth

Bearer-token contract: every non-health route requires `Authorization: Bearer <supabase access token>`, validated via `supabase.auth.getUser(token)` through `@open-harness/runtime-core/bearer-auth`.

## Rollup tree-shake note

`nitro.config.ts` forces `moduleSideEffects` for `.nitro/workflow/**` and `workflow/**` because neither `workflow` nor `@workflow/core` declare `sideEffects: true`. Without the override, rollup DCE's `registerStepFunction(...)` calls from the generated `.nitro/workflow/steps.mjs`, and steps fail with `StepNotRegisteredError` at runtime.
