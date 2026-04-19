# Open Agents

Summary of changes in **this fork** versus upstream [`vercel-labs/open-agents`](https://github.com/vercel-labs/open-agents):

- **Supabase database** — Wired the app to Supabase Postgres with SQL migrations under `supabase/migrations/`, replacing the prior Drizzle-centric setup for core persistence.
- **Supabase Auth** — Added Supabase-backed authentication and seed data; removed the Vercel OAuth–based login path from the hosted UI.
- **Fewer Vercel product ties** — Removed Vercel login/projects UI affordances, dropped use of the Vercel AI gateway for model routing, and removed the leaderboard feature.
- **Security and types** — Added Row Level Security policies and regenerate Supabase TypeScript types (`database.types.ts`) for the new schema.
- **API cleanup** — Removed the Vercel project env-vars API route and its tests.

Open Agents is an open-source reference app for building and running background coding agents on Vercel. It includes the web UI, the agent runtime, sandbox orchestration, and the GitHub integration needed to go from prompt to code changes without keeping your laptop involved.

The repo is meant to be forked and adapted, not treated as a black box.

## What it is

Open Agents is a three-layer system:

```text
Web -> Agent workflow -> Sandbox VM
```

- The web app handles auth, sessions, chat, and streaming UI.
- The agent runs as a durable workflow on Vercel.
- The sandbox is the execution environment: filesystem, shell, git, dev servers, and preview ports.

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
- repo cloning and branch work inside the sandbox
- optional auto-commit, push, and PR creation after a successful run
- session sharing via read-only links
- optional voice input via ElevenLabs transcription

## Runtime notes

A few details that matter for understanding the current implementation:

- Chat requests start a workflow run instead of executing the agent inline.
- Each agent turn can continue across many persisted workflow steps.
- Active runs can be resumed by reconnecting to the stream for the existing workflow.
- Sandboxes use a base snapshot, expose ports `3000`, `5173`, `4321`, and `8000`, and hibernate after inactivity.
- Auto-commit and auto-PR are supported, but they are preference-driven features, not always-on behavior.

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

### Stored secrets (GitHub tokens, etc.)

Anything that encrypts persisted credentials needs:

```env
ENCRYPTION_KEY=
```

### Supabase Auth (sign-in)

Configure **Authentication → URL configuration** in the Supabase dashboard: set the site URL to your deployment origin and add redirect URLs `https://YOUR_DOMAIN/auth/callback` and `http://localhost:3000/auth/callback` for local development. The three Supabase env vars above must match your project.

### Required for GitHub repo access, pushes, and PRs

If you want users to connect GitHub, install the app on repos/orgs, clone private repos, push branches, or open PRs, add these GitHub App values:

```env
NEXT_PUBLIC_GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_APP_ID=
GITHUB_APP_PRIVATE_KEY=
NEXT_PUBLIC_GITHUB_APP_SLUG=
GITHUB_WEBHOOK_SECRET=
```

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
Recommended path: deploy this repo at the repo root, then configure Supabase and GitHub.

1. Fork this repo.
2. Create a Supabase project. Apply the SQL in `supabase/migrations/` to your database (Supabase SQL editor or `supabase db push` against your linked project).
3. Generate an encryption secret for stored tokens:

   ```bash
   openssl rand -hex 32   # ENCRYPTION_KEY (32-byte hex)
   ```

4. Import the repo.
5. Add at least these env vars in Vercel project settings:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   ENCRYPTION_KEY=
   OPENAI_API_KEY=
   ```

6. Deploy once to get a stable production URL.
7. In the Supabase dashboard, set Authentication URL configuration (site URL + redirect URLs including `https://YOUR_DOMAIN/auth/callback`).
8. If you want the full GitHub-enabled coding-agent flow, create a GitHub App using:

   - Homepage URL: `https://YOUR_DOMAIN`
   - Callback URL: `https://YOUR_DOMAIN/api/github/app/callback`
   - Setup URL: `https://YOUR_DOMAIN/api/github/app/callback`

   In the GitHub App settings:
   - enable "Request user authorization (OAuth) during installation"
   - use the GitHub App's Client ID and Client Secret for `NEXT_PUBLIC_GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`
   - make the app public if you want org installs to work cleanly

9. Add the GitHub App env vars and redeploy.
10. Optionally add Redis/KV and the canonical production URL vars.

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

## Auth and integration setup

### Supabase Auth

Match the Supabase **Site URL** and **Redirect URLs** to where the app runs (`https://YOUR_DOMAIN` and `https://YOUR_DOMAIN/auth/callback`, plus `http://localhost:3000` / `http://localhost:3000/auth/callback` for local dev). Keys come from **Project Settings → API**.

### GitHub App

You do not need a separate GitHub OAuth app. Open Agents uses the GitHub App's user authorization flow.

Create a GitHub App for installation-based repo access and configure:

- Homepage URL: `https://YOUR_DOMAIN`
- Callback URL: `https://YOUR_DOMAIN/api/github/app/callback`
- Setup URL: `https://YOUR_DOMAIN/api/github/app/callback`
- enable "Request user authorization (OAuth) during installation"
- make the app public if you want org installs to work cleanly

For local development, use `http://localhost:3000/api/github/app/callback` for the callback/setup URL and `http://localhost:3000` as the homepage URL.

Then set:

```env
NEXT_PUBLIC_GITHUB_CLIENT_ID=...   # GitHub App Client ID
GITHUB_CLIENT_SECRET=...           # GitHub App Client Secret
GITHUB_APP_ID=...
GITHUB_APP_PRIVATE_KEY=...
NEXT_PUBLIC_GITHUB_APP_SLUG=...
GITHUB_WEBHOOK_SECRET=...
```

`GITHUB_APP_PRIVATE_KEY` can be stored as the PEM contents with escaped newlines or as a base64-encoded PEM.

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
