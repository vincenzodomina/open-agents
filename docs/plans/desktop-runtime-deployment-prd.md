# Desktop App and Detached Runtime Deployment PRD

## 1. Executive Summary

The project will support a desktop distribution that packages the current application experience inside an Electron shell, defaults to a locally embedded frontend server and detached runtime process, and can also connect to detached runtimes over HTTP or SSH. The web application will remain deployable in its current form, while a new detached runtime service will own runtime-dependent behavior behind the existing API surface.

## 2. Problem Statement

Users need a portable way to run the desktop app without giving up the existing web experience. They also need flexibility to choose where agent execution happens: fully local, on an HTTP-accessible runtime, or on an SSH-only machine they control. At the same time, authentication and data access should remain tied to a separately managed Supabase instance rather than being coupled to where the agent runtime is hosted.

## 3. Scope

## 3.1 Goals

- Package the current application into an Electron desktop app with an embedded local frontend server as the default experience.
- Introduce a detached runtime service that owns runtime-dependent behavior while preserving the existing browser-facing API paths.
- Keep the current web deployment model working.
- Support three runtime connection modes: embedded, HTTP, and SSH.
- Standardize detached runtime authentication on bearer tokens derived from the Supabase user session.
- Keep database access and authentication anchored to a separately managed Supabase instance regardless of runtime location.
- Maximize code sharing in a single monorepo across web, runtime, and desktop applications.

## 3.2 Non-Goals

- Building a renderer-only desktop app that bypasses the local frontend server.
- Replacing the existing browser-facing API path structure with a new namespace.
- Moving all data access, settings, or non-runtime workflows into the detached runtime.
- Making SSH connectivity a supported mode for the hosted web application.
- Giving the detached runtime responsibility for provisioning or managing its own database or identity provider.

## 3.3 Constraints

- The monorepo will contain three first-class applications: the web frontend, the detached runtime, and the desktop shell.
- The desktop app must always start a local frontend server for SSR pages and local-only behavior.
- The detached runtime will be a separate process in every mode, including embedded mode.
- Browser code will continue to call the existing same-origin API paths.
- The web frontend will keep the existing API surface and transparently proxy only the runtime-dependent subset to the detached runtime.
- The detached runtime will be authoritative for runtime-dependent behavior and API semantics.
- Detached runtime authentication will use a single bearer-token contract based on the Supabase access token, with refresh support for long-running interactions when needed.
- The frontend and desktop applications will continue to use the configured Supabase URL and anonymous key directly for user authentication and straightforward data access.
- Runtime location and database location must remain independent decisions.
- SSH connectivity will be owned by the desktop shell and exposed to the local frontend as a resolved local runtime URL.
- Desktop security and packaging should follow established Electron hardening and process-isolation practices already proven in the broader repository ecosystem.
- The connection mode must be externally configurable. `SERVER_CONNECTION_MODE` will support `embedded`, `http`, and `ssh`. `SERVER_CONNECTION_URL` will define the runtime target for HTTP mode.

## 4. Requirements

## 4.1 Distribution and Runtime Modes

| ID | Description or User Story |
|---|---|
| **FR-1.** | As a desktop user, I want the application to launch with no extra setup, so that I can use it locally by default. |
| **FR-2.** | As a desktop user, I want the default desktop startup flow to launch both the local frontend server and a detached local runtime process, so that the embedded experience exercises the same runtime boundary as remote modes. |
| **FR-3.** | As an operator, I want to configure the runtime connection mode as `embedded`, `http`, or `ssh`, so that one desktop build can support local, remote, and tunnel-based execution. |
| **FR-4.** | As a developer or operator, I want HTTP mode to work with both locally running development runtimes and hosted runtimes, so that the transport model stays the same across local and remote environments. |
| **FR-5.** | As a desktop user, I want SSH mode to connect to a runtime on a machine that is not publicly exposed over HTTPS, so that I can run the agent on a VM or workstation I control. |

## 4.2 Frontend, Proxy, and API Surface

| ID | Description or User Story |
|---|---|
| **FR-6.** | As an existing user of the web app, I want the browser-facing API paths to remain unchanged, so that the current frontend can continue to operate without a parallel API namespace. |
| **FR-7.** | As a frontend user, I want SSR pages and local-only frontend behavior to continue to come from the local frontend server, so that desktop mode preserves the current application experience. |
| **FR-8.** | As a platform maintainer, I want the local frontend server to proxy only the runtime-dependent subset of API behavior to the detached runtime, so that non-runtime responsibilities remain local to the frontend application. |
| **FR-9.** | As a platform maintainer, I want the frontend proxy to behave as a thin HTTP pass-through, including streaming behavior, so that runtime logic has a single source of truth in the detached runtime. |
| **FR-10.** | As a web deployer, I want the web application to remain deployable as a web app in its current form, so that desktop support does not replace or weaken hosted web deployment. |

## 4.3 Authentication, Data Ownership, and Supabase

| ID | Description or User Story |
|---|---|
| **FR-11.** | As a platform maintainer, I want detached runtime requests to authenticate with `Authorization: Bearer <Supabase access token>`, so that all detached modes share one auth contract. |
| **FR-12.** | As a user, I want my authenticated identity and permissions to be consistent regardless of whether the runtime is local, remote over HTTP, or reached over SSH, so that runtime location does not change my authorization model. |
| **FR-13.** | As an operator, I want the detached runtime to rely on a separately managed Supabase instance for identity and user-scoped data access, so that runtime hosting and database hosting remain independent. |
| **FR-14.** | As a user, I want the frontend and desktop app to continue using the configured Supabase browser credentials directly for sign-in and straightforward CRUD, so that the detached runtime is only responsible for runtime behavior rather than becoming a general data gateway. |
| **FR-15.** | As a platform maintainer, I want long-running runtime interactions to support token freshness or refresh-aware handling, so that detached runtimes can safely serve streaming and extended agent activity without breaking authentication mid-run. |

## 4.4 Desktop Orchestration and SSH Connectivity

| ID | Description or User Story |
|---|---|
| **FR-16.** | As a desktop user, I want the Electron shell to act primarily as a wrapper and connection manager, so that the web frontend and detached runtime remain reusable outside desktop packaging. |
| **FR-17.** | As a desktop user, I want the desktop shell to own SSH tunnel creation, health checks, and teardown, so that the frontend can treat SSH mode as a normal local runtime URL. |
| **FR-18.** | As a desktop user, I want the desktop shell to manage the lifecycle of embedded processes and connection state, so that startup, shutdown, and failure handling are coherent across all modes. |
| **FR-19.** | As a desktop user, I want clear failure behavior when the detached runtime is unreachable or unhealthy, so that I can distinguish frontend availability from runtime availability. |
| **FR-20.** | As a maintainer, I want the desktop package to follow Electron hardening best practices for process isolation, privilege boundaries, and packaging, so that desktop distribution does not introduce avoidable security regressions. |

## 4.5 Monorepo and Reuse

| ID | Description or User Story |
|---|---|
| **FR-21.** | As a maintainer, I want the desktop shell, frontend, and detached runtime to live in the same monorepo, so that shared code and release management stay coherent. |
| **FR-22.** | As a maintainer, I want shared runtime logic to be extracted into reusable modules rather than duplicated between frontend and detached runtime, so that future changes have a single implementation path. |
| **FR-23.** | As a maintainer, I want desktop-specific behavior to remain narrowly scoped to process orchestration, connection management, and packaging, so that most product logic continues to be shared with the web app. |

## 5. Testing

- Good tests must validate observable behavior and integration contracts rather than implementation details.
- The highest priority tests are end-to-end and contract tests covering embedded, HTTP, and SSH runtime modes.
- The detached runtime should be tested for bearer-token authentication, streaming correctness, route ownership, and failure handling.
- The frontend proxy should be tested for transparent forwarding, header propagation, streaming passthrough, and clear error surfaces when the runtime is unavailable.
- The desktop shell should be tested for process orchestration, connection mode selection, SSH tunnel lifecycle, health checks, and cleanup on shutdown or restart.
- The web deployment should be regression-tested to confirm the existing hosted web app behavior remains intact.
- Packaging verification should include smoke tests for supported desktop targets and install/startup validation.
- Prior art should follow the repository’s existing patterns for route tests, stream-oriented tests, and desktop process-orchestration tests where available.

## 6. Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Streaming behavior breaks when proxied through the frontend server. | Keep the proxy layer intentionally thin and test streaming end-to-end across all connection modes. |
| Desktop and web deployments drift into separate architectures over time. | Keep the frontend server as the stable browser-facing boundary and make the detached runtime authoritative for runtime behavior in every mode. |
| Auth behavior becomes inconsistent between local and remote modes. | Standardize on a single bearer-token contract for the detached runtime in all modes. |
| Runtime hosting and database hosting become accidentally coupled. | Require the runtime to depend on an externally managed Supabase instance and keep frontend Supabase configuration explicit. |
| SSH mode becomes fragile or difficult to support. | Make SSH a desktop-only responsibility with explicit tunnel lifecycle management, health checks, and user-visible failure states. |
| Electron packaging introduces security regressions. | Follow established Electron hardening practices for sandboxing, isolated renderer execution, controlled IPC, and constrained process privileges. |
| The extraction of the detached runtime creates duplicated logic. | Move shared runtime concerns into reusable shared modules and keep the frontend proxy free of business logic. |

## 7. Further Notes

### 7.1 Deployment Topology

```text
Hosted Web App
  -> Frontend server
      -> existing /api surface
          -> thin proxy for runtime-dependent routes
              -> colocated or remote detached runtime

Desktop App
  -> Electron shell
      -> local frontend server
          -> existing /api surface
              -> thin proxy for runtime-dependent routes
                  -> embedded runtime process
                  -> HTTP runtime target
                  -> SSH-forwarded runtime target
```

### 7.2 Source of Truth

- The frontend server is the stable browser-facing surface.
- The detached runtime is the source of truth for runtime-dependent behavior.
- Supabase remains the source of truth for user identity and application data.
