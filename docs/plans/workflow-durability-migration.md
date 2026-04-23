# Workflow Durability Migration (Phase 3)

## Goal

Move `apps/web/app/workflows/chat.ts` (the 1079-line durable workflow body that drives agent execution, auto-commit, auto-PR) into a detached runtime service with **Postgres-backed durability** via `@workflow/world-postgres`. After migration, the runtime is authoritative for both runtime-dependent behavior (agent loop) AND durability (workflow state), so any client — web, desktop embedded, CLI, SSH-tunneled — gets the same semantics.

## Architectural principle

Runtime owns runtime-dependent behavior. Durability IS runtime-dependent behavior (it's the state machine of a running workflow). Therefore durability moves with the workflow code.

## Environment-dependent world selection

```bash
# Self-hosted (primary target)
WORKFLOW_TARGET_WORLD="@workflow/world-postgres"
WORKFLOW_POSTGRES_URL="$DATABASE_URL"  # same Supabase DB the web app uses

# Vercel deploy (secondary, must still work)
# No env var needed — Vercel auto-detects VercelWorld
```

Self-hosted deployments in all three PRD connection modes (embedded, HTTP, SSH) use PostgresWorld. Vercel deployments use VercelWorld. No per-mode branching in workflow code.

## POC outcomes (see `apps/workflow-poc/README.md`)

- ✅ `workflow` + `workflow/nitro` compiles `"use workflow"` and `"use step"` directives outside Next.js
- ✅ Nitro v3 auto-discovers routes, webhooks, workflow manifest
- ✅ HTTP layer, `start()`, `getRun()` API functional
- ✅ Step execution in prod builds works (rollup tree-shake fix in `nitro.config.ts`: `moduleSideEffects` preserves `.nitro/workflow/**` and `workflow/**`)
- ✅ PostgresWorld against local Supabase — schema migration via `workflow-postgres-setup`, runs complete correctly
- ✅ Durability across server crash — SIGKILL mid-run, restart, new process re-enqueues and completes the run

## Open architectural decision: one runtime or two?

### Option A: One runtime — migrate `apps/runtime` to Node+Nitro

**Pros:**
- Single service simplifies desktop shell (one subprocess instead of two)
- Uniform deployment story
- One auth layer, one token refresh, one health check

**Cons:**
- Loses Bun across the board (Bun's been fine for us so far; no hot pain point to give up)
- Forces non-workflow routes (`generate-title`, `generate-commit-message`, `transcribe`) to migrate from Bun handlers to Nitro handlers — ~200 LOC rewrite
- Higher blast radius if the workflow runtime has stability issues

### Option B: Two runtimes — keep Bun for lightweight, add Node+Nitro for workflow

**Pros:**
- Non-workflow routes keep working untouched
- Workflow service can iterate independently; stability isolation
- If workflow SDK hits issues, non-workflow paths unaffected

**Cons:**
- Desktop shell spawns two subprocesses, manages two lifecycles, two health checks
- Two deployment artifacts
- Two auth middlewares (though the `bearer-auth` helper is shared)
- Connection-mode config grows (need `WORKFLOW_CONNECTION_URL` alongside `SERVER_CONNECTION_URL`)

### Recommendation

**Start with Option B.** Isolation during migration reduces risk. If after Phase 3c (chat migration) the workflow runtime proves stable and the ops complexity of two services becomes painful, consolidate to Option A in a Phase 4 cleanup. Going the other direction (one → two) after migration is harder because web code will have grown assumptions.

## Migration phases

### 3a: Fix POC step-registration ✅ DONE

Root cause: neither `workflow` nor `@workflow/core` declare `sideEffects`, so rollup tree-shook the `registerStepFunction(...)` calls out of the generated `steps.mjs`. Result: step registry was empty at request time even though the build artifacts were correct.

Fix: `rollupConfig.treeshake.moduleSideEffects` override in `nitro.config.ts` preserves `.nitro/workflow/**` and `workflow/**` modules' side effects. Bundle goes from 0 → 6 `registerStepFunction` calls.

### 3b: PostgresWorld against Supabase ✅ DONE

Applied migrations with `workflow-postgres-setup` against `postgres://postgres:postgres@127.0.0.1:54322/postgres`. Booted server with `WORKFLOW_TARGET_WORLD=@workflow/world-postgres`. Workflow completes end-to-end.

Durability confirmed: SIGKILL mid-run, restart — new process logs `[world-postgres] Re-enqueued 1 active run(s) on startup` and completes the run. This is the guarantee we needed; the chat workflow body can now move into the runtime without losing runs on crash or redeploy.

Follow-up for productionization (not a blocker for 3c):
- Fold the workflow schema migration into `supabase/migrations/` so it's applied alongside app migrations, or make `workflow-postgres-setup` a post-deploy hook.
- Decide on a `WORKFLOW_POSTGRES_JOB_PREFIX` to namespace queues if we want multiple independent workflow services later.

### 3c-1: Chat workflow skeleton + stub layer ✅ DONE

The full `apps/web/app/workflows/chat.ts` + `chat-post-finish.ts` + `usage-utils.ts` (1592 LOC total) now lives at `apps/workflow-runtime/server/workflows/`, compiles clean against:

- `@open-harness/shared/lib/chat-types` — extracted `WebAgent*` type family; `apps/web/app/types.ts` is now a thin re-export shim
- `@open-harness/shared/lib/dedupe-message-reasoning` — pure helper moved to shared
- `@open-harness/shared/lib/workflow-run-types` — pure `WorkflowRunStatus` + `WorkflowRunStepTiming` types
- `server/workflows/stubs/*` — temporary no-op stubs for all DB writes (sessions/workflow-runs/usage), auto-commit, auto-PR, compute-diff. See `stubs/README.md` for the inventory.

New endpoints wired up with bearer auth:
- `POST /api/chat/start` — starts `runAgentWorkflow`, returns `{ runId }`
- `POST /api/chat/runs/:id/stop` — cancels a run

The webAgent's dynamic `await import("@/app/config")` was replaced with `await import("@open-harness/agent/open-harness-agent")` — removes the runtime's implicit dependency on apps/web.

### 3c-2a: Plumbing stubs replaced ✅ DONE

Four of seven stubs are now real implementations:
- **`db-sessions.ts`** — `getSupabaseAdmin()` helper in `server/utils/supabase-admin.ts` (service-role client); all 8 functions the workflow uses now issue real queries/RPCs, mirroring `apps/web/lib/db/sessions.ts`.
- **`db-workflow-runs.ts`** — verbatim port, calls `record_workflow_run` RPC.
- **`db-usage.ts`** — verbatim port, inserts into `usage_events`.
- **`sandbox-lifecycle.ts`** — minimal port of the two activity/active update builders chat uses.

### 3c-2b: Remaining feature stubs (follow-up session, ~2–3 days)

Three stubs still no-op; they're product features, not plumbing:
- `auto-commit-direct.ts` — sandbox + GitHub token operations. Needs `getUserGitHubToken` (DB-backed). Port from `apps/web/lib/chat/auto-commit-direct.ts`.
- `auto-pr-direct.ts` — GitHub REST API calls for PR creation. Port from `apps/web/lib/chat/auto-pr-direct.ts`.
- `compute-diff.ts` — sandbox diff + blob cache. Port from `apps/web/lib/diff/compute-diff.ts`.

Also in 3c-2b: rename the `stubs/` directory (now misleading; holds real impls). Single import update in `chat-post-finish.ts`.

### 3c-2c: auto-commit-direct + auto-pr-direct ✅ DONE

Last two feature stubs are now real. Pure helpers (`crypto`, `repo-identifiers`) extracted to `@open-harness/shared`; DB-coupled and Octokit-coupled helpers duplicated in `apps/workflow-runtime/server/utils/` (GitHub account + token + app trailer + branches + pull requests + pr-content). `stubs/` directory renamed to `impl/` now that everything under it is real.

### 3c-3a: Runtime streaming endpoints + /stop wiring ✅ DONE

- Runtime `/api/chat/start` now returns a full streaming `createUIMessageStreamResponse` with `x-workflow-run-id` header (was `{ runId }`).
- New runtime `/api/chat/runs/:id/stream` (GET) resumes streaming for an existing run; returns 204 when the run is completed/cancelled/failed or not found.
- `createCancelableReadableStream` extracted from `apps/web/lib/chat/` to `@open-harness/shared/lib/cancelable-readable-stream` so both runtimes use one copy.
- Web `/api/chat/[chatId]/stop` rewritten as a thin proxy calling the runtime's `/api/chat/runs/:id/stop`. The web keeps auth, ownership, assistant-snapshot persistence, and CAS-clear of `activeStreamId` — the runtime just cancels the run. Tests swap the `workflow/api` module mock for a `getWorkflowClient` mock.

### 3c-3b: Wire `/api/chat/route.ts` and `/api/chat/[chatId]/stream/route.ts` ✅ DONE

Main chat POST is now a thin facade:
- Auth, bot-id, body parsing, ownership check, managed-template-trial check, user message / assistant tool-results persistence, lifecycle refresh, model variant resolution, and Options body assembly all stay on web.
- The `reconcileExistingActiveStream` helper now calls runtime `/api/chat/runs/:id/stream` instead of `getRun().status/getReadable()`. 204 from the runtime → CAS-clear `activeStreamId`, fall through; 200 with body → forward response headers and body to the browser.
- The fresh-start path POSTs the full Options body to runtime `/api/chat/start`. Reads `x-workflow-run-id` from response headers, runs the CAS claim, and on race loses both cancels the runtime stream (`body.cancel()`) and POSTs `/api/chat/runs/:id/stop`.
- 20 route tests migrated — `workflow/api` + `@/app/workflows/chat` mocks replaced with a single `@/lib/runtime-connection/workflow-client` mock that captures each `fetch(path, init)` call. `startCalls[0]?.[1]` assertions became `getStartBody()` which JSON-parses the request body.

Stream resume route (`/api/chat/[chatId]/stream`) is a simpler proxy of the same runtime `/stream` endpoint with a 204-on-not-running fallback that clears `activeStreamId`.

Runtime stream endpoint now returns `x-workflow-run-id` header in its `createUIMessageStreamResponse` so the web side can forward it through unchanged.

### 3c-3c: Decommission duplicated web-side chat workflow code ✅ DONE

- Deleted `apps/web/app/workflows/chat.ts`, `chat-post-finish.ts`, `usage-utils.ts` and the three corresponding test files. The canonical copies live at `apps/workflow-runtime/server/workflows/`.
- Pruned chat entries from `apps/web/public/.well-known/workflow/v1/manifest.json`. Remaining manifest entries are just the `sandboxLifecycleWorkflow` steps, which are untouched.
- Rewired `apps/web/app/api/sessions/[sessionId]/chats/[chatId]/messages/[messageId]` DELETE off `workflow/api`; it now calls runtime `GET /api/runs/:id` to check workflow status before allowing a delete mid-stream. Test updated to mock `getWorkflowClient` instead of `workflow/api`.

### Phase 4: Sandbox lifecycle workflow → runtime ✅ DONE

- Ported the sandbox-hibernation workflow to `apps/workflow-runtime/server/workflows/sandbox-lifecycle.ts`. Dependencies moved:
  - `apps/workflow-runtime/server/utils/sandbox-utils.ts` — `canOperateOnSandbox`, `clearSandboxState`, `getPersistentSandboxName` (minimal subset web's `lib/sandbox/utils.ts` exposes).
  - `apps/workflow-runtime/server/workflows/impl/sandbox-lifecycle.ts` — extended to include `evaluateSandboxLifecycle`, `getLifecycleDueAtMs`, `buildHibernatedLifecycleUpdate` and the full lifecycle state-machine types.
  - `impl/db-sessions.ts` — added `claimSessionLifecycleRunId`, and `getSessionById` + `getChatsBySessionId` now return the lifecycle fields the evaluator needs (status, lifecycleState, lifecycleRunId, sandboxState, lastActivityAt, hibernateAfter, sandboxExpiresAt, activeStreamId).
- New runtime HTTP endpoint `POST /api/sandbox/lifecycle/kick` — takes `{ sessionId, reason }`, runs the stale-run detection + CAS claim + `start(sandboxLifecycleWorkflow)` logic that used to live on web. Has an inline fallback to `evaluateSandboxLifecycle()` if `start()` throws.
- Web `lib/sandbox/lifecycle-kick.ts` collapsed to a thin HTTP call (POST to runtime, log+swallow failures). Four web route callers (`sandbox`, `sandbox/status`, `sandbox/extend`, `sandbox/snapshot`) unchanged — same function signature.
- Deleted `apps/web/app/workflows/sandbox-lifecycle.ts` (the workflow body).
- Deleted `apps/web/public/.well-known/workflow/v1/manifest.json` and its containing directories (nothing on web owns any workflows now).
- Dropped `workflow` dep from `apps/web/package.json`.
- Removed the `workflow` TS plugin from `apps/web/tsconfig.json`.
- Removed `withWorkflow` wrapper from `apps/web/next.config.ts`.
- `mock.module("workflow/api", ...)` no longer appears anywhere in `apps/web`.

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| `@workflow/nitro` incompatible with latest Nitro v3 (POC blocker) | Pin to known-good versions; fall back to Hono + Rollup adapter |
| graphile-worker schema conflicts with existing Supabase tables | Use prefixed schema (`WORKFLOW_POSTGRES_JOB_PREFIX`); isolated by default |
| Workflow runtime crash loses in-flight streams | PostgresWorld persists step state; runs resume on server restart (that's the point) |
| Two-runtime complexity creeps | Revisit consolidation after 3c lands and we have real ops feedback |
| Chat migration surfaces hidden coupling to Next.js internals | Incremental — migrate step-by-step, keep web handlers thin facades |

## Out of scope (for Phase 3; comes later)

- Observability (`npx workflow web`) integration into our UI
- Workflow-level auth (runtime-side validates bearer; workflow body trusts the caller)
- Replay-based debugging UX
- Batch operations / bulk resume
