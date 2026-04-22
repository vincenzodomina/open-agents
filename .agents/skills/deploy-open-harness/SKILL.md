---
name: deploy-open-harness
description: Guides a user through collecting the credentials needed to deploy their own copy of Open Harness, deploying this repo on Vercel, and completing first-run setup. Use for requests about deploying, self-hosting, configuring credentials, or getting started with a fork of this app.
---

You are helping a user deploy their own copy of Open Harness.

Base your guidance on the current codebase, not on older Harness-era setup assumptions.

## First rule: verify current requirements from the repo

Before giving deployment advice, read these files if you have not already:

- `README.md`
- `apps/web/.env.example`
- `apps/web/lib/db/client.ts`
- `apps/web/lib/supabase/server.ts`
- `apps/web/app/auth/login/page.tsx`
- `apps/web/lib/redis.ts`
- `apps/web/lib/sandbox/config.ts`

If the code and the docs disagree, trust the code and say so.

Do not rely on `scripts/setup.sh`.

## Goals

Help the user:

1. Collect only the credentials actually required.
2. Understand where to obtain each credential.
3. Deploy this repo on Vercel.
4. Complete first-run verification.
5. Leave with a short next-steps checklist.

## Safety rules

- Never ask the user to paste secrets into chat.
- Tell them where each value belongs, but keep secret values in Vercel project env vars or local env files.
- Be explicit when something is optional.

## Credential checklist

Use this checklist when guiding the user.

### Required for the app to run

- `POSTGRES_URL`

### Required for a usable hosted deployment

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Optional

- `REDIS_URL` or `KV_URL`
- `VERCEL_PROJECT_PRODUCTION_URL`
- `NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL`
- `VERCEL_SANDBOX_BASE_SNAPSHOT_ID`
- `ELEVENLABS_API_KEY`

## How to explain each credential

### PostgreSQL
Tell the user to create a Postgres database and copy the connection string into `POSTGRES_URL`.

### Supabase Auth
Explain that sign-in uses Supabase. They need the project URL and anon key, and must configure Site URL and redirect URLs in the Supabase dashboard (including `{ORIGIN}/auth/callback`).

### Redis / KV
Explain that Redis is optional. It improves resumable streams, stop signaling, and caching, but it is not required for the first deploy.

## Deployment flow

Guide the user through this sequence:

1. Fork the repo.
2. Import it into Vercel at the repo root.
3. Add the baseline env vars:
   - `POSTGRES_URL`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy once to get a stable production URL.
5. Configure Supabase Auth Site URL and redirect URLs for that URL.
6. Optionally add Redis/KV and the production URL vars.

If the user already has a custom domain ready, it is fine to use that domain from the start instead of the default `vercel.app` production URL.

## First-run verification

For a minimal deploy, walk the user through:

1. Open the production site.
2. Sign in with Supabase (email/password or your configured providers).
3. Confirm they land in the app successfully.
4. Create a session and confirm the basic UI loads.

If something fails, identify the missing credential or callback mismatch instead of giving generic advice.

## Response format

When helping a user, prefer this structure:

1. **Credential checklist** — grouped into required now vs optional later.
2. **How to get each missing credential** — short, concrete instructions.
3. **Deploy steps** — only the next actions the user should take.
4. **Verification** — what to click/test after deploy.
5. **Next upgrades** — Redis, voice, custom domain, snapshot override, only if relevant.

Be concise. Keep the user moving toward the next unblocker.