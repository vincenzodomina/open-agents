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
- ⚠️ Step execution in prod builds has a registration gap — one session of debugging needed
- ⏳ PostgresWorld not yet wired (blocked on above)

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

### 3a: Fix POC step-registration (next session, ~2–4h)

Diagnose the prod-build `StepNotRegisteredError`. Likely one of:
- `nitro@3.0.0-beta.x` + `h3@2.0.1-rc.2` compat issue with `@workflow/nitro`
- Missing `nitro.options.handlers` wiring in the workflow module under Nitro v3
- Needs a specific `experimental` flag

Mitigation if Nitro proves unstable: switch to **Hono + Rollup** (the workflow SDK's Hono integration uses Rollup directly, with a smaller surface).

**Deliverable:** POC runs a multi-step durable workflow under prod build, steps execute, run completes successfully.

### 3b: PostgresWorld against Supabase (1 session, ~3–6h)

1. Run `npx workflow-postgres-setup` pointed at local Supabase:
   ```bash
   WORKFLOW_POSTGRES_URL="postgres://postgres:postgres@127.0.0.1:54322/postgres" \
   WORKFLOW_TARGET_WORLD="@workflow/world-postgres" \
   bun run --cwd apps/workflow-poc setup-pg
   ```
2. Verify the `graphile_worker` schema lands isolated from our app schema.
3. Restart server mid-workflow — confirm state persists and run resumes.
4. Document the migration script in our `supabase/migrations/` or as a CI step.

**Deliverable:** POC's `countToN` workflow survives server kill/restart mid-execution.

### 3c: Chat workflow migration (2–3 sessions, ~1–2 weeks)

This is the payoff. The 1079-line `apps/web/app/workflows/chat.ts` moves to the new workflow service.

Challenges to work through:
- **Imports from web (`@/lib/db/sessions`, `@/app/types`, helpers under `chat-post-finish.ts`).** Decide per-import: move to shared package? Duplicate in workflow service? Query the web API?
- **DB writes during steps.** Persist assistant messages, update session state, record usage. Runtime needs DB access — fine per PRD (same Supabase, different client).
- **Workflow run ID ↔ chat.activeStreamId coordination.** Web still tracks active stream on the chat record so the UI can resume. Runtime returns the run ID; web stores it.
- **Streaming response.** Web route does `createUIMessageStreamResponse({ stream: run.getReadable() })`. New flow: web calls runtime, runtime starts workflow, runtime returns the workflow's readable stream. Proxy needs to handle `getReadable()` semantics.

### 3d: Wire chat HTTP routes (1 session, ~4–8h)

- `/api/chat/route.ts` → call runtime's `/v1/chat/start`, forward stream
- `/api/chat/[chatId]/stream/route.ts` → call runtime's `/v1/chat/[runId]/stream`
- `/api/chat/[chatId]/stop/route.ts` → call runtime's `/v1/chat/[runId]/cancel`

Keep the web-side auth/ownership checks (session, bot-id, chat ownership). Push the workflow orchestration to runtime.

### 3e: Env branching + tests (1 session, ~4–8h)

- `WORKFLOW_TARGET_WORLD` env honors hosted (Vercel World) vs self-hosted (Postgres World)
- Update `turbo.json` with workflow env vars
- Update desktop shell to spawn/connect the workflow runtime per connection mode
- End-to-end test: embedded mode desktop session, start chat, kill/restart runtime, verify resume

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
