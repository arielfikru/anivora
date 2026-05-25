# Anivora

A anime/fanmade streaming platform (Anivora) split into a **Hono** backend and a **TanStack Router SPA** frontend, orchestrated with **moon** in a pnpm workspace. Ships with multi-tenancy, role-based access control, authentication, and production-ready infrastructure.

## Stack

| Layer | Technology |
|-------|-----------|
| Monorepo | moon + pnpm workspaces |
| Frontend | React 19 + TanStack Router (SPA, file-based) + Vite |
| Backend | Hono + oRPC (RPC + OpenAPI) |
| Data fetching | TanStack Query + oRPC client |
| Auth | better-auth (email/password, Google OAuth) |
| Database | PostgreSQL 16 + Drizzle ORM |
| Cache | Redis 7 + ioredis |
| Styling | Tailwind CSS v4 + shadcn/ui |
| i18n | Paraglide v2 (EN + ID) |
| Analytics | PostHog |
| Linting | Biome |
| Dev environment | devenv.sh + direnv (Mac/Linux), Docker + PowerShell (Windows) |

## Project Structure

```
anivora/
├── .moon/                 # workspace, toolchain, inherited tasks
├── apps/
│   ├── api/               # Hono backend (@anivora/api)
│   │   ├── drizzle/       # generated migrations
│   │   ├── drizzle.config.ts
│   │   └── src/
│   │       ├── main.ts    # Hono entry: /auth, /rpc, /api, optional SPA static
│   │       ├── index.ts   # type-only barrel (AppRouter, Session, AppRole)
│   │       ├── auth/      # better-auth config + permissions
│   │       ├── db/        # drizzle client, schema, seed
│   │       ├── orpc/      # context, middleware, zod schemas
│   │       ├── redis/     # cache helpers
│   │       ├── routers/   # oRPC procedures (auth-routes, user-routes, …)
│   │       ├── activity.ts
│   │       ├── polyfill.ts
│   │       └── utils/
│   └── web/               # TanStack Router SPA (@anivora/web)
│       ├── index.html
│       ├── vite.config.ts # dev proxy: /rpc /auth /api → api:3001
│       └── src/
│           ├── main.tsx   # SPA entry
│           ├── router.tsx
│           ├── styles.css
│           ├── routes/    # __root, _public (auth pages), _authenticated (org-scoped)
│           ├── components/
│           ├── hooks/
│           └── libs/
│               ├── auth/      # better-auth react client + shared permissions
│               ├── orpc/      # typed client (imports AppRouter from @anivora/api)
│               ├── paraglide/, posthog/, clsx/, hooks/, tanstack-*/
└── docker-compose.yml     # prod: single image (Hono serves SPA + api)
```

Web imports **types only** from `@anivora/api` (`AppRouter`, `Session`, `AppRole`). All runtime calls go over HTTP.

## Getting Started

### Mac / Linux (Nix)

Install [devenv](https://devenv.sh) and [direnv](https://direnv.net), then:

```bash
direnv allow   # starts Postgres + Redis automatically
pnpm install
cp .env.example .env.local   # edit with your values
pnpm db:push
```

### Windows (PowerShell)

Requires [Node.js 22+](https://nodejs.org/), [pnpm](https://pnpm.io/installation), and [Docker Desktop](https://www.docker.com/products/docker-desktop/).

**Option A: Setup script (recommended)**

```powershell
.\scripts\setup-windows.ps1
```

Starts PostgreSQL + Redis via Docker, creates `.env.local` with an auto-generated `BETTER_AUTH_SECRET`, installs dependencies, and pushes the DB schema. Safe to re-run.

**Option B: Manual**

```powershell
pnpm dev:services
cp .env.example .env.local
pnpm install
pnpm db:push
```

**Stop services:**

```powershell
pnpm dev:services:stop                              # stop, keep data
docker compose -f docker-compose.dev.yml down -v    # stop + delete data
```

### VS Code Dev Container

Open the project in VS Code and select **"Reopen in Container"** when prompted. Works on any OS with Docker Desktop.

### Environment variables

See `.env.example`. Required:

```env
DATABASE_URL=postgresql://tanstack:tanstack@127.0.0.1:5432/tanstack_start_dev
REDIS_URL=redis://127.0.0.1:6379
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=   # pnpm dlx @better-auth/cli secret
WEB_ORIGIN=http://localhost:3000   # used by the api CORS
```

Optional:

```env
VITE_API_URL=          # set in prod if web and api are on different origins; leave empty in dev (vite proxies)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
VITE_POSTHOG_KEY=
```

### Database

```bash
pnpm db:push     # apply schema
pnpm db:seed     # seed super-admin + demo user + demo org
```

Seed credentials:

| Email | Password | Role |
|-------|----------|------|
| superadmin@example.com | Password123! | super-admin |
| user@example.com | Password123! | member |

### Dev servers

```bash
pnpm dev        # moon runs web (:3000) and api (:3001) in parallel
pnpm dev:web    # web only
pnpm dev:api    # api only
```

Vite proxies `/rpc`, `/auth`, and `/api` to the Hono backend, so web and api stay same-origin and cookies just work.

## Production

### Docker (single image, recommended)

```bash
docker compose up --build
```

The Dockerfile is multi-stage: it builds the web SPA, then ships the api image with the built `dist/` mounted at `WEB_DIST_PATH`. Hono serves `/rpc`, `/auth`, `/api`, and falls through to `index.html` for client-side routes.

### Manual

```bash
pnpm build                  # moon builds all apps (emits apps/web/dist)
pnpm --filter @anivora/api start
```

Set `WEB_DIST_PATH=<absolute path to apps/web/dist>` if you want the api to serve the SPA. Otherwise deploy web and api to separate hosts and set `VITE_API_URL` at build time.

## Role System

Two layers:

- **Platform role** (`user.role`): `super-admin` bypasses all org checks.
- **Org role** (`member.role`): `owner` / `admin` / `member` — per-org permissions, configurable via the permissions matrix in the UI.

## i18n

Language is set via the `?lang=` query param (`en` or `id`). Switch using the dropdown in the sidebar footer. Add messages to `apps/web/src/libs/paraglide/messages/`.

## Database commands

Run from the repo root (delegates to `@anivora/api`):

```bash
pnpm db:generate   # generate migration files
pnpm db:migrate    # run migrations
pnpm db:push       # push schema directly (dev)
pnpm db:studio     # open Drizzle Studio
pnpm db:seed       # seed demo data
```

**Dev vs Prod:** Use `db:push` for local iteration (no migration files). For staging/prod, **always** use the versioned flow: edit `schema.ts` → `pnpm db:generate` → commit the new SQL under `apps/api/drizzle/` → deploy runs `pnpm db:migrate`. CI runs `drizzle-kit generate` on every PR and fails if uncommitted migration drift is detected.

Or run directly inside `apps/api`:

```bash
pnpm --filter @anivora/api db:push
moon run api:db-push
```

## Moon tasks

```bash
moon run :dev            # run dev in every project
moon run web:dev         # one project
moon run :build          # build everything
moon run :check          # biome check everywhere
moon run api:db-migrate  # project-scoped task
```

The root `package.json` scripts are thin wrappers around these.

## Scripts (root)

```bash
pnpm dev                # moon :dev (web + api)
pnpm dev:web            # web only
pnpm dev:api            # api only
pnpm build              # moon :build
pnpm test               # moon :test (vitest in each app)
pnpm lint               # moon :lint (biome lint)
pnpm format             # moon :format
pnpm check              # moon :check
pnpm storybook          # @anivora/web storybook on :6006
pnpm dev:services       # start PostgreSQL + Redis (Docker)
pnpm dev:services:stop  # stop them
```
