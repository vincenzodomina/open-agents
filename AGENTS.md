# AGENTS.md

This file provides guidance for AI coding agents working in this repository.

**This is a living document.** When you make a mistake or learn something new about this codebase, add it to [Lessons Learned](docs/agents/lessons-learned.md).

## Quick Links

- [Architecture & Workspace Structure](docs/agents/architecture.md)
- [Code Style & Patterns](docs/agents/code-style.md)
- [Lessons Learned](docs/agents/lessons-learned.md)

## Database & Migrations

App-level TypeScript types live in `apps/web/lib/db/schema.ts`. Optional generated Supabase types go to `apps/web/lib/db/database.types.ts` (see `db:types` below). **DDL and RPCs are authored as SQL** under `supabase/migrations/` at the repo root.

Scripts are in `apps/web/package.json`. Run them with `bun run --cwd apps/web <script>`. The Supabase CLI resolves `supabase/config.toml` at the monorepo root (walk up from `apps/web`). Use a **local** stack (`supabase start`) for `--local` commands.

| Script | What it runs |
|--------|----------------|
| `db:diff` | `supabase db diff -f schema_update` — create a new migration file from schema drift vs the local DB (adjust the `-f` name in `package.json` if you prefer). |
| `db:types` | `supabase gen types typescript --local > lib/db/database.types.ts` — regenerate TypeScript types from the **local** database. |
| `db:push` | `supabase db push --local` — apply pending migrations to the **local** Supabase instance. |
| `db:check` | `bun run scripts/check-migrations.ts` — CI guard that `supabase/migrations/` contains `.sql` files. |
| `build` | Runs `db:push` then `next build`, so local migrations are applied before the Next.js build (requires local Supabase running when you build this way). |

Commit new `.sql` files under `supabase/migrations/` with your changes.

### Environment isolation

Neon database branching is enabled in the Vercel project settings. Every preview deployment automatically gets its own isolated database branch forked from production. This means preview deployments never read or write production data. Production deployments use the main Neon database.

## Commands

```bash
# Development
bun run web            # Run web app

# Quality checks (REQUIRED after making any changes)
bun run ci                                 # Required: run format check, lint, typecheck, and tests
turbo typecheck                            # Type check all packages

# Linting and formatting (Ultracite - oxlint + oxfmt, run from root)
bun run check                              # Lint and format check all files
bun run fix                                # Lint fix and format all files

# Filter by package (use --filter)
turbo typecheck --filter=web # Type check web app only

# Testing
bun test                                              # Run all tests
bun test path/to/file.test.ts                         # Run single test file
bun test --watch                                      # Watch mode
bun run test:verbose                                  # Run tests with JUnit reporter streamed to stdout (useful in non-interactive shells)
bun run test:verbose path/to/file.test.ts             # Same verbose output for a single test file
```

**CI/script execution rules:**

- Run project checks through package scripts (for example `bun run ci`, `bun run --cwd apps/web db:check`).
- Prefer `bun run <script>` over invoking tool binaries directly (`bunx`, `bun x`, `tsc`, `eslint`, etc.) so local runs match CI behavior.

## Git Commands

- **Branch sync preference:** When bringing in `origin/main`, prefer a normal merge (`git fetch origin main` then `git merge origin/main`) instead of rebasing, unless explicitly requested otherwise.

**Quote paths with special characters**: File paths containing brackets (like Next.js dynamic routes `[id]`, `[slug]`) are interpreted as glob patterns by zsh. Always quote these paths in git commands:

```bash
# Wrong - zsh interprets [id] as a glob pattern
git add apps/web/app/tasks/[id]/page.tsx
# Error: no matches found: apps/web/app/tasks/[id]/page.tsx

# Correct - quote the path
git add "apps/web/app/tasks/[id]/page.tsx"
```

## Architecture (Summary)

```
Web -> Agent (packages/agent) -> Sandbox (packages/sandbox)
```

See [Architecture & Workspace Structure](docs/agents/architecture.md) for details.

## File Organization & Separation of Concerns

- Do **not** append new functionality to the bottom of an existing file by default.
- Before adding code, decide whether the behavior is a separate concern that should live in its own file.
- Prefer creating a new colocated file for distinct concerns (components, hooks, utilities, schemas, data-access helpers, etc.).
- If a file is already large or handling multiple responsibilities, extract the new logic (and related helpers/types) into focused modules and import them.
- For large page/view/client components, default to adding new feature behavior in colocated hooks and colocated child components instead of growing the main file.
- If a change introduces a distinct cluster of state, effects, handlers, API calls, or derived UI labels for one feature, treat that as a strong signal to extract it.
- Keep each file focused on one primary responsibility; avoid mixing unrelated UI, business logic, and data-access code in the same file.

## Code Style (Summary)

- **Bun exclusively** (not Node/npm/pnpm)
- **Files**: kebab-case, **Types**: PascalCase, **Functions**: camelCase
- **Never use `any`** -- use `unknown` and narrow with type guards
- **No `.js` extensions** in imports
- **Ultracite** (oxlint + oxfmt) for linting and formatting (double quotes, 2-space indent)
- **Zod** schemas for validation, derive types with `z.infer`

See [Code Style & Patterns](docs/agents/code-style.md) for full conventions, tool implementation patterns, and dependency patterns.
