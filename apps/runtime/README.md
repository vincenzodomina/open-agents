# Runtime

Detached HTTP service that owns runtime-dependent behavior (agent execution, streaming, long-running workflows). Phase 1 scaffolding — exposes health, whoami, and a streaming echo endpoint as the reference contract.

## Running locally

```bash
bun run --cwd apps/runtime dev
```

Requires the same `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` that the web app uses — the runtime validates incoming bearer tokens against that Supabase instance. Runtime-dependent routes that call LLMs also need `OPENAI_API_KEY` (and optionally `OPENAI_BASE_URL`) in the runtime's env, not the web app's.

## Auth contract

Every non-health route requires `Authorization: Bearer <supabase access token>`. Tokens are validated via `supabase.auth.getUser(token)` — no separate identity provider.

### Token freshness (FR-15)

Supabase access tokens default to a 1h TTL. To support long-running interactions without breaking auth mid-run, the **web proxy** (not the runtime) owns token refresh:

1. The proxy sends the current access token on every forwarded request.
2. If the runtime returns `401` (expired or just-rotated token), the proxy asks Supabase for a fresh access token via `supabase.auth.refreshSession()` and retries the request **once** with the new token.
3. The runtime itself is stateless with respect to refresh — it never sees refresh tokens and never mints tokens. It only validates the bearer it's given.

Implications for route authors:
- Route handlers do not need to re-validate the bearer mid-stream. The one-shot validation at request entry is the contract.
- If a future route needs to call Supabase with user scope mid-stream, either (a) route it back through the web proxy so the proxy owns the refresh, or (b) use the service-role admin client (pattern used by the existing web chat handlers).
- Streaming is preserved: because refresh happens only in response to a 401 *before* any response body has been consumed, successful streams are never interrupted by a retry.

## Endpoints

- `GET /v1/health` — liveness, no auth
- `GET /v1/whoami` — returns the authenticated user id (auth required)
- `POST /v1/echo-stream` — streams back each whitespace-delimited token from the request body (auth required, exercises streaming boundary)
- `POST /v1/generate-title` — generates a 5-word coding-session title from a first user message (auth required, calls OpenAI via `@open-harness/agent`)
- `POST /v1/generate-commit-message` — generates a conventional-format commit message from a sandbox diff (auth required, takes `{ sandboxState, sessionTitle }`)
- `POST /v1/transcribe` — transcribes base64 audio via ElevenLabs (auth required, takes `{ audio, mimeType? }`)

## Extending

Real runtime-dependent routes (chat, generate-title, etc.) migrate here in later phases. Keep each route's handler behind `requiresAuth: true` and return a `ReadableStream` for anything long-running so the web proxy stays thin.
