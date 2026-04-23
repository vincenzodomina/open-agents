# Architecture

This is a Turborepo monorepo for "Open Harness" - an AI coding agent built with AI SDK.

## Core Flow

```
Web -> Agent (packages/agent) -> Sandbox (packages/sandbox)
```

1. **Web** handles authentication, session management, and the primary user interface
2. **Agent** (`deepAgent`) is a `ToolLoopAgent` with tools for file ops, bash, and task delegation
3. **Sandbox** abstracts file system and shell operations for cloud execution backends

## Key Packages

- **packages/agent/** - Core agent implementation with tools, subagents, and context management
- **packages/sandbox/** - Execution environment abstraction for cloud sandboxes
- **packages/shared/** - Shared utilities across packages

## Subagent Pattern

The `task` tool delegates to specialized subagents:
- **explorer**: Read-only, for codebase research (grep, glob, read, safe bash)
- **executor**: Full access, for implementation tasks (all tools)

## Workspace Structure

```
apps/
  web/           # Web interface (Next.js)
  runtime/       # Bun service: LLM endpoints + durable workflows (chat, sandbox-lifecycle)
  desktop/      # Electron shell that runs web + runtime locally or proxies to a remote runtime
packages/
  agent/         # Core agent logic (@open-harness/agent)
  sandbox/       # Sandbox abstraction (@open-harness/sandbox)
  shared/        # Shared utilities (@open-harness/shared)
  runtime-core/  # Connection-mode, bearer auth, token refresh helpers
  tsconfig/      # Shared TypeScript configs
```

## Runtime

`apps/runtime` is a single Bun service that hosts both lightweight LLM endpoints and the durable workflow SDK (Vercel `workflow` + `@workflow/world-postgres`). Workflows (chat, sandbox-lifecycle) are built from source at boot via `@workflow/builders` `StandaloneBuilder`, which emits `.well-known/workflow/v1/{step,flow,webhook}.mjs` bundles. The server mounts those as the workflow control-plane routes and `getWorld().start()` subscribes to the Postgres queue.

Web talks to the runtime via `getRuntimeClient()` using `SERVER_CONNECTION_URL`. On Vercel deploys, `WORKFLOW_TARGET_WORLD` stays unset and the SDK uses Vercel's hosted world; otherwise `WORKFLOW_TARGET_WORLD=@workflow/world-postgres` + `WORKFLOW_POSTGRES_URL` points at the self-hosted queue (Supabase Postgres).
