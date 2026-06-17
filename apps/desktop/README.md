# Desktop

Electron shell that wraps the local Next.js frontend and manages the detached runtime.

## Running locally (dev)

```bash
bun install
bun run --cwd apps/web build
bun run --cwd apps/desktop build
bun run --cwd apps/desktop start
```

## Modes

Set via `SERVER_CONNECTION_MODE`:

- `embedded` (default) — shell spawns both the local Next.js server and the runtime subprocess.
- `http` — shell skips the embedded runtime and expects `SERVER_CONNECTION_URL` to point at an HTTP-reachable runtime.
- `ssh` — shell opens an SSH tunnel (`SSH_TARGET`, `SSH_REMOTE_PORT`) and points the frontend at the local forwarded port.

The frontend always receives `SERVER_CONNECTION_MODE=http` plus the resolved `SERVER_CONNECTION_URL` so it treats every runtime target uniformly.

## Supabase env propagation

The embedded runtime validates incoming bearer tokens via Supabase, so it needs `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in its environment. Today the desktop shell inherits these from Electron's own env, so when you launch in development they come from your shell. For packaged builds these need to be passed explicitly (baked at build time or read from a user-editable settings file).

## Token freshness across modes

The runtime only needs the anon key to validate bearers — it is never given refresh capability, regardless of connection mode. Long-running sessions stay authenticated because the **web proxy** (inside the local frontend server the desktop shell spawns) transparently refreshes the Supabase access token on 401 and retries once. Embedded, HTTP, and SSH modes are symmetrical: no per-mode branching in the handshake.

## Security posture

The `BrowserWindow` is created with `sandbox: true`, `contextIsolation: true`, `nodeIntegration: false`. Renderer has no direct Node access. `setWindowOpenHandler` denies all renderer-initiated `window.open()` calls. Production packaging (signing, notarization, auto-update, preload bridge for OS integration) is not yet wired.

## Single-instance lock

The shell calls `app.requestSingleInstanceLock()` on startup. A second launch exits immediately, and the first instance's `second-instance` handler focuses the existing window. This prevents two shells from fighting over ports 3000/3001.

## Logging

Lifecycle events (bootstrap, spawn, shutdown) go through `electron-log` with a 5 MB per-file rotation cap. Subprocess stdout/stderr is forwarded directly to the parent process's `stdout`/`stderr` so streaming logs aren't buffered or reformatted.
