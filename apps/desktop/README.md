# Desktop

Electron shell that wraps the local Next.js frontend and manages the detached runtime. Phase 1 scaffolding — embedded, HTTP, and SSH runtime modes are wired; SSH retry/hardening and full Electron packaging land in later phases.

## Running locally (dev)

```bash
# From repo root
bun install
bun run --cwd apps/web build

# Start desktop shell (embedded mode by default — spawns runtime + frontend)
bun run --cwd apps/desktop build
bun run --cwd apps/desktop start
```

## Modes

Set via `SERVER_CONNECTION_MODE`:

- `embedded` (default) — shell spawns both the local Next.js server and the runtime subprocess.
- `http` — shell skips the embedded runtime and expects `SERVER_CONNECTION_URL` to point at an HTTP-reachable runtime.
- `ssh` — shell opens an SSH tunnel (`SSH_TARGET`, `SSH_REMOTE_PORT`) and points the frontend at the local forwarded port.

The frontend always receives `SERVER_CONNECTION_MODE=http` plus the resolved `SERVER_CONNECTION_URL` so it treats every runtime target uniformly — consistent with FR-17.

## Supabase env propagation

The embedded runtime validates incoming bearer tokens via Supabase, so it needs `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in its environment. Today the desktop shell inherits these from Electron's own env — so when you launch in development they come from your shell. For packaged builds we need to pass them explicitly (either baked at build time or read from a user-editable settings file); that's out of scope for Phase 1. Don't assume packaged desktop users will have these exported.

## Security posture

The `BrowserWindow` is created with `sandbox: true`, `contextIsolation: true`, `nodeIntegration: false`. Renderer has no direct Node access. Production packaging (signing, notarization, auto-update, preload bridge for OS integration) is deferred to the packaging phase.
