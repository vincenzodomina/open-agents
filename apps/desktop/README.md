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

## Security posture

The `BrowserWindow` is created with `sandbox: true`, `contextIsolation: true`, `nodeIntegration: false`. Renderer has no direct Node access. Production packaging (signing, notarization, auto-update, preload bridge for OS integration) is deferred to the packaging phase.
