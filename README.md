# Liberia Works

Workforce management platform for Liberia's Ministry of Labour. Connects job seekers (Individuals), employers, and MoL staff through a single system that enforces regulatory requirements — mandatory advertising for work permits, dispute SLAs, compliance certificates, and more.

## Workspace layout

```
apps/
  api/        Fastify REST API (Vercel serverless)
  web/        Next.js 16 frontend (App Router, Vercel)
  mobile/     Mobile app (stub)
packages/
  shared-types/    TypeScript enums and API response types
  shared-schemas/  Zod validation schemas shared between API and web
  shared-utils/    Liberian phone normalisation, LRA number validation
  shared/          Legacy types (pre-standardisation)
```

## Production stack

| Layer | Service |
|-------|---------|
| API + web hosting | Vercel (two projects, one per app) |
| Database | Supabase Postgres 16 (`postgis` + `pgvector` extensions) |
| Cache (rate-limit, idempotency, bot session) | Upstash Redis |
| Background jobs | Inngest (events + cron) |
| File storage | Vercel Blob |
| SMS / WhatsApp | Africa's Talking (primary), Twilio (standby) |
| Email | Resend |

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 20 |
| pnpm | ≥ 9.15.4 |
| Docker | any recent version (Postgres + Redis only) |

## Local development

```bash
pnpm install
cp .env.example .env          # fill in secrets

# Start local Postgres + Redis (+ pgadmin)
make dev-infra                # or: docker compose up -d postgres redis

# Migrate and seed
pnpm --filter @liberia-works/api db:migrate:dev
pnpm --filter @liberia-works/api db:seed:locations
pnpm --filter @liberia-works/api db:seed

# In separate terminals
make dev-api                  # API on :3001
make dev-web                  # Web on :3000
make dev-inngest              # Inngest dev server UI on :8288
```

The Inngest dev server auto-discovers `/api/inngest` on the local API and lets you trigger events from a UI.

| Service | URL |
|---------|-----|
| Web app | http://localhost:3000 |
| API | http://localhost:3001 |
| API docs (Scalar) | http://localhost:3001/documentation |
| Inngest dev UI | http://localhost:8288 |
| PostgreSQL | localhost:5434 |
| Redis | localhost:6379 |
| pgadmin | http://localhost:5020 |

## Root scripts

| Command | What it does |
|---------|-------------|
| `pnpm dev` | Start all apps and packages in watch mode (Turborepo) |
| `pnpm build` | Build all packages and apps in dependency order |
| `pnpm typecheck` | Type-check the entire workspace |
| `pnpm test` | Run all test suites |
| `pnpm lint` | Lint all apps and packages |
| `pnpm clean` | Remove all `dist/`, `.next/`, and `node_modules/` |

## Tooling

- **Package manager**: pnpm 9 workspaces
- **Build orchestration**: Turborepo 2 (task graph in `turbo.json`)
- **TypeScript**: 5.7, base config in `tsconfig.base.json`
- **Formatting**: Prettier

## Environment variables

Copy `.env.example` to `.env` at the repo root. The file is documented inline. In production, secrets are managed per-environment in the Vercel dashboard for each project.

## Deployment

Both apps deploy to Vercel from this monorepo:

- **API** — Vercel project rooted at `apps/api`. `vercel.json` declares the build, and a catch-all rewrite forwards every request to the single serverless function at `api/index.ts`, which boots Fastify and proxies the raw Node request.
- **Web** — Vercel project rooted at `apps/web`. `vercel.json` runs the workspace shared-package build before `next build`.

Database migrations run from `.github/workflows/deploy.yml` on push to `main` / `staging` against the matching Supabase project, using the **DIRECT_URL** (port 5432). Vercel's deploy is not gated on this step — keep schema changes additive.

Background functions live in `apps/api/src/lib/inngest/` and are served at `POST /api/inngest`. Inngest cloud discovers them on each deploy.
