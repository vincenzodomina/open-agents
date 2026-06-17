# Runtime

Single Bun service hosting the web app's backend runtime concerns:
- Lightweight LLM endpoints (`/v1/generate-title`, `/v1/generate-commit-message`, `/v1/transcribe`)
- Durable workflows (`/v1/chat/*`, `/v1/sandbox/lifecycle/kick`) via Vercel `workflow` SDK + `@workflow/world-postgres`
- Workflow control plane (`/.well-known/workflow/v1/{step,flow,webhook}`) consumed by the world-postgres queue

## Running locally

```bash
export WORKFLOW_TARGET_WORLD="@workflow/world-postgres"
export WORKFLOW_POSTGRES_URL="postgres://postgres:postgres@127.0.0.1:54322/postgres"
export NEXT_PUBLIC_SUPABASE_URL="..."
export NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
export SUPABASE_SERVICE_ROLE_KEY="..."

bun run --cwd apps/runtime setup-pg   # one-time: create workflow tables
bun run --cwd apps/runtime dev
```

`dev` runs `src/workflow-build.ts` (StandaloneBuilder compiles `src/workflows/*.ts` into `src/.well-known/workflow/v1/*.mjs`) then starts the server with `--hot`. On Vercel deploys leave `WORKFLOW_TARGET_WORLD` unset — the SDK auto-detects the hosted world.

## Endpoints

- `GET /v1/health` — liveness, no auth
- `GET /v1/whoami` — authenticated user summary
- `POST /v1/echo-stream` — streaming smoke test
- `POST /v1/generate-title` — session title generation
- `POST /v1/generate-commit-message` — commit message from sandbox diff
- `POST /v1/transcribe` — base64 audio → text via ElevenLabs
- `POST /v1/chat/start` — starts a chat workflow run, returns SSE stream with `x-workflow-run-id` header
- `GET /v1/chat/runs/:id/stream` — resume a chat stream via `run.getReadable()`
- `POST /v1/chat/runs/:id/stop` — cancels a chat run
- `GET /v1/runs/:id` — run status
- `POST /v1/sandbox/lifecycle/kick` — enqueues a sandbox-lifecycle evaluation

All non-health routes require `Authorization: Bearer <supabase access token>`, validated through `@open-harness/runtime-core/bearer-auth`.

### Token freshness

Supabase access tokens are short-lived. The **web proxy** owns refresh: on 401 it asks Supabase for a fresh token and retries once. The runtime is stateless w.r.t. refresh — it only validates the bearer it's given, so long-running streams are never interrupted by mid-flight refresh.

## Workflow build

`StandaloneBuilder` scans `src/workflows/` for `"use workflow"` and `"use step"` directives, SWC-transforms them, and emits standalone bundles under `src/.well-known/workflow/v1/`. The server loads those bundles dynamically at request time and mounts `POST` handlers on the control-plane paths. `src/workflow-stubs.ts` reads the generated `manifest.json` to attach `workflowId` to stub functions that route handlers pass into `start()`.

## Durability

Confirmed: SIGKILL mid-run, restart — new process logs `[world-postgres] Re-enqueued N active run(s) on startup` and resumes.
