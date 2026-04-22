# Workflow POC

**Status: architecture validated end-to-end under LocalWorld AND PostgresWorld, including durability across server crash.** Delete or evolve into the real workflow runtime once Phase 3c is ready.

Proof-of-concept for Phase 3 of the desktop runtime deployment. Validates that Vercel's `workflow` SDK can be self-hosted with Nitro + `@workflow/world-postgres` pointed at Supabase Postgres — the prerequisite for migrating `apps/web/app/workflows/chat.ts` to a detached runtime.

## What this POC validates

✅ **`workflow` + `workflow/nitro` compiles `"use workflow"` and `"use step"` directives outside Next.js.** The build produces `.nitro/workflow/{steps.mjs, workflows.mjs, webhook.mjs, manifest.json}` — a complete workflow manifest with 5 steps and 1 workflow discovered from our `counter.ts` file.

✅ **Nitro scans API routes under configured `srcDir`.** `srcDir: "./server"` picks up `server/api/*.ts` correctly. Routes registered at build time: `/api/health`, `/api/count`, `/api/runs/:id`, plus 3 auto-registered workflow webhook routes at `/.well-known/workflow/v1/{step,flow,webhook}`.

✅ **`start(workflow, [args])` returns a run handle**, `getRun(runId).status` reads run state. Run IDs are ULID-prefixed (`wrun_01KPV...`), confirming the LocalWorld is operational in-process.

✅ **Nitro v3 config keys for this project.** Working config:
```ts
import { defineNitroConfig } from "nitro/config";
export default defineNitroConfig({
  srcDir: "./server",
  modules: ["workflow/nitro"],
});
```

✅ **End-to-end workflow execution in production builds.** A `countToN` workflow starts, runs multiple `addOne` steps with 2s sleeps between them, and transitions `running` → `completed` correctly. The earlier `StepNotRegisteredError` was a rollup tree-shaking bug: neither `workflow` nor `@workflow/core` declare `sideEffects: true`, so rollup dead-code-eliminated every `registerStepFunction(...)` call in the generated `steps.mjs`. Fixed in `nitro.config.ts` via a `rollupConfig.treeshake.moduleSideEffects` override that preserves `.nitro/workflow/**` and `workflow/**` modules' side effects.

✅ **PostgresWorld against local Supabase.** Ran `workflow-postgres-setup` against `postgres://postgres:postgres@127.0.0.1:54322/postgres` — migrations applied cleanly into isolated schemas. Booting the server with `WORKFLOW_TARGET_WORLD=@workflow/world-postgres` gives durable runs backed by `graphile-worker`.

✅ **Restart durability.** SIGKILL the server mid-workflow (at t+3s of a ~12s run), start a fresh process — new server logs `[world-postgres] Re-enqueued 1 active run(s) on startup` and completes the run from where it left off. This is the whole point: Supabase (or any user-managed Postgres) is enough to survive crashes, no Vercel-specific infra.

## Running (dev mode, mostly works)

```bash
bun run --cwd apps/workflow-poc dev
curl -X POST --json '{"target":2}' http://127.0.0.1:3000/api/count
```

## Running (prod build — works)

```bash
bun run --cwd apps/workflow-poc build
node apps/workflow-poc/.output/server/index.mjs
# in another shell:
curl -X POST --json '{"target":3}' http://127.0.0.1:3000/api/count
# response: {"runId":"wrun_...","target":3}
curl http://127.0.0.1:3000/api/runs/<runId>
# eventually: {"runId":"...","status":"completed"}
```

## Architectural takeaways for Phase 3

- **Node runtime is required, not Bun.** Nitro CLI runs under Node; `bun run nitro` works because bun exec'ed node. The built output is a Node server (`.output/server/index.mjs`). This means the workflow runtime is a different tech stack from our Bun-based `apps/runtime`.
- **Two runtimes in embedded mode.** Desktop shell will need to spawn both the existing Bun runtime (lightweight routes) AND a Node workflow runtime (chat, durable work). OR we collapse both into one Node+Nitro service, losing Bun across the board.
- **Workflow directives require specific file layout.** The `workflow/nitro` module scans under `srcDir`. Workflows must live under there (tried external `./workflows/` first — step registrations didn't propagate).
- **Schema migration via `workflow-postgres-setup`.** This is a one-shot command that creates the `graphile_worker` + workflow schemas in our Supabase DB. Isolated schemas, won't collide with existing app tables.
- **No Vercel-specific runtime coupling at compile time.** The same workflow code compiles for LocalWorld, VercelWorld, or PostgresWorld based on env var. Deployment mode branches via `WORKFLOW_TARGET_WORLD`.

## Next steps (Phase 3 plan)

1. **Fix the step-registration wrinkle** (1 session). Figure out what nitro@3 + h3@2 + `workflow/nitro` needs. Likely either (a) file an issue with workflow SDK, (b) pin to an older Nitro version with known-good compat, or (c) switch to the Hono + Rollup adapter if Nitro proves flaky.
2. **Swap LocalWorld → PostgresWorld.** Set `WORKFLOW_TARGET_WORLD=@workflow/world-postgres`, `WORKFLOW_POSTGRES_URL=postgres://postgres:postgres@127.0.0.1:54322/postgres`, run `bun run setup-pg`. Verify workflow state persists across server restart.
3. **Decide: one runtime or two.** If we go "one runtime," `apps/runtime` migrates from Bun to Node+Nitro, and the already-migrated routes (`generate-title`, `generate-commit-message`, `transcribe`) become Nitro handlers. If we go "two runtimes," workflow-poc evolves into `apps/workflow-runtime` and both run alongside. Recommendation deferred to user.
4. **Migrate `apps/web/app/workflows/chat.ts`** to the workflow runtime (Phase 3c). Wire `/api/chat/*` web routes to call the new runtime.
