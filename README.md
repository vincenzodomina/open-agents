# Open Agents

Summary of changes in **this fork** versus upstream [`vercel-labs/open-agents`](https://github.com/vercel-labs/open-agents):

- **Supabase database** — Wired the app to Supabase Postgres with SQL migrations under `supabase/migrations/`, replacing the prior Drizzle-centric setup for core persistence.
- **Supabase Auth** — Added Supabase-backed authentication and seed data; removed the Vercel OAuth–based login path from the hosted UI.
- **Fewer Vercel product ties** — Removed Vercel login/projects UI affordances, dropped use of the Vercel AI gateway for model routing, and removed the leaderboard feature.
- **Security and types** — Added Row Level Security policies and regenerate Supabase TypeScript types (`database.types.ts`) for the new schema.
- **API cleanup** — Removed the Vercel project env-vars API route and its tests.
- **Minimal chat flow** — This fork is trimmed toward `login -> start session -> chat -> sandbox/filesystem tools`, with git/PR-specific UI and routes removed from the main product flow.

Open Agents is an open-source reference app for building and running background coding agents on Vercel. It includes the web UI, the agent runtime, and sandbox orchestration for chat-driven coding sessions.

The repo is meant to be forked and adapted, not treated as a black box.

## What it is

Open Agents is a three-layer system:

```text
Web -> Agent workflow -> Sandbox VM
```

- The web app handles auth, sessions, chat, and streaming UI.
- The agent runs as a durable workflow on Vercel.
- The sandbox is the execution environment: filesystem, shell, dev servers, and preview ports.

### The key architectural decision: the agent is not the sandbox

The agent does not run inside the VM. It runs outside the sandbox and interacts with it through tools like file reads, edits, search, and shell commands.

That separation is the main point of the project:

- agent execution is not tied to a single request lifecycle
- sandbox lifecycle can hibernate and resume independently
- model/provider choices and sandbox implementation can evolve separately
- the VM stays a plain execution environment instead of becoming the control plane

## Current capabilities

- chat-driven coding agent with file, search, shell, task, skill, and web tools
- durable multi-step execution with Workflow SDK-backed runs, streaming, and cancellation
- isolated Vercel sandboxes with snapshot-based resume
- session sharing via read-only links
- optional voice input via ElevenLabs transcription

## Runtime notes

A few details that matter for understanding the current implementation:

- Chat requests start a workflow run instead of executing the agent inline.
- Each agent turn can continue across many persisted workflow steps.
- Active runs can be resumed by reconnecting to the stream for the existing workflow.
- Sandboxes use a base snapshot, expose ports `3000`, `5173`, `4321`, and `8000`, and hibernate after inactivity.
- `just-bash` is a lightweight in-process sandbox for local exploration; it provides a mounted workspace and shell-like command execution, not a full VM.

## What is actually required today

These requirements are based on the current `apps/web` codepath and `apps/web/.env.example`.

### Minimum runtime

Supabase connects the Next.js app to Postgres (schema lives in `supabase/migrations/`):

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

### Agent runs

The coding agent stack expects direct OpenAI API access:

```env
OPENAI_API_KEY=
```

### Supabase Auth (sign-in)

Configure **Authentication → URL configuration** in the Supabase dashboard: set the site URL to your deployment origin and add redirect URLs `https://YOUR_DOMAIN/auth/callback` and `http://localhost:3000/auth/callback` for local development. The three Supabase env vars above must match your project.

### Optional

```env
REDIS_URL=
KV_URL=
VERCEL_PROJECT_PRODUCTION_URL=
NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL=
VERCEL_SANDBOX_BASE_SNAPSHOT_ID=
ELEVENLABS_API_KEY=
```

- `REDIS_URL` / `KV_URL`: optional skills metadata cache (falls back to in-memory when not configured).
- `VERCEL_PROJECT_PRODUCTION_URL` / `NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL`: canonical production URL for metadata and some callback behavior.
- `VERCEL_SANDBOX_BASE_SNAPSHOT_ID`: override the default sandbox snapshot.
- `ELEVENLABS_API_KEY`: voice transcription.

## Deploy your own copy
Recommended path: deploy this repo at the repo root, then configure Supabase.

1. Fork this repo.
2. Create a Supabase project. Apply the SQL in `supabase/migrations/` to your database (Supabase SQL editor or `supabase db push` against your linked project).
3. Import the repo.
4. Add at least these env vars in Vercel project settings:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   OPENAI_API_KEY=
   ```

5. Deploy once to get a stable production URL.
6. In the Supabase dashboard, set Authentication URL configuration (site URL + redirect URLs including `https://YOUR_DOMAIN/auth/callback`).
7. Optionally add Redis/KV and the canonical production URL vars.

## Local setup

1. Install dependencies:

   ```bash
   bun install
   ```

2. Create your local env file:

   ```bash
   cp apps/web/.env.example apps/web/.env
   ```

3. Fill in the required values in `apps/web/.env`. For a local database, run `supabase start` from the repo root and apply migrations, or point the Supabase env vars at a dev project.
4. Start the app:

   ```bash
   bun run web
   ```

## Auth setup

### Supabase Auth

Match the Supabase **Site URL** and **Redirect URLs** to where the app runs (`https://YOUR_DOMAIN` and `https://YOUR_DOMAIN/auth/callback`, plus `http://localhost:3000` / `http://localhost:3000/auth/callback` for local dev). Keys come from **Project Settings → API**.

## Useful commands

```bash
bun run web
bun run check
bun run typecheck
bun run ci
bun run sandbox:snapshot-base
```

## Repo layout

```text
apps/web         Next.js app, workflows, auth, chat UI
packages/agent   agent implementation, tools, subagents, skills
packages/sandbox sandbox abstraction and Vercel sandbox integration
packages/shared  shared utilities
supabase/        Postgres migrations and Supabase CLI config
```
