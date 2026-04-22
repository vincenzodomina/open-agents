# Runtime

Detached HTTP service that owns runtime-dependent behavior (agent execution, streaming, long-running workflows). Phase 1 scaffolding — exposes health, whoami, and a streaming echo endpoint as the reference contract.

## Running locally

```bash
bun run --cwd apps/runtime dev
```

Requires the same `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` that the web app uses — the runtime validates incoming bearer tokens against that Supabase instance.

## Auth contract

Every non-health route requires `Authorization: Bearer <supabase access token>`. Tokens are validated via `supabase.auth.getUser(token)` — no separate identity provider.

## Endpoints

- `GET /v1/health` — liveness, no auth
- `GET /v1/whoami` — returns the authenticated user id (auth required)
- `POST /v1/echo-stream` — streams back each whitespace-delimited token from the request body (auth required, exercises streaming boundary)

## Extending

Real runtime-dependent routes (chat, generate-title, etc.) migrate here in later phases. Keep each route's handler behind `requiresAuth: true` and return a `ReadableStream` for anything long-running so the web proxy stays thin.
