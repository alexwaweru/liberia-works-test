# Liberia Works

Workforce management platform for Liberia's Ministry of Labour. Connects job seekers (Individuals), employers, and MoL staff through a single system that enforces regulatory requirements — mandatory advertising for work permits, dispute SLAs, compliance certificates, and more.

## Workspace layout

```
apps/
  api/        Fastify REST API (PostgreSQL + Redis + BullMQ)
  web/        Next.js 16 frontend (App Router)
  mobile/     Mobile app (stub)
packages/
  shared-types/    TypeScript enums and API response types
  shared-schemas/  Zod validation schemas shared between API and web
  shared-utils/    Liberian phone normalisation, LRA number validation
  shared/          Legacy types (pre-standardisation)
```

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 20 |
| pnpm | ≥ 9.15.4 |
| Docker + Docker Compose | any recent version |
| PostgreSQL 16 | local or via Docker |
| Redis 7 | local or via Docker |

## Quick start (Docker)

```bash
cp .env.example .env          # fill in secrets
docker compose up --build
```

| Service | URL |
|---------|-----|
| Web app | http://localhost:3000 |
| API | http://localhost:3001 |
| API docs (Swagger) | http://localhost:3001/documentation |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |

## Quick start (local)

```bash
pnpm install
cp .env.example .env          # fill in secrets

# Start infrastructure
docker compose up postgres redis -d

# Migrate and seed
pnpm --filter @liberia-works/api db:migrate:dev
pnpm --filter @liberia-works/api db:seed

# Start all apps in watch mode
pnpm dev
```

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

Copy `.env.example` to `.env` at the repo root. The file is documented inline. In production, secrets are managed by Doppler — never commit real values.

## Docker

Each app has a multi-stage `Dockerfile` that uses the monorepo root as build context:

```bash
# API image only
docker build -f apps/api/Dockerfile -t liberia-works-api .

# Web image only
docker build -f apps/web/Dockerfile -t liberia-works-web .
```

The `NEXT_PUBLIC_API_URL` build argument controls the API URL baked into the web image:

```bash
docker build -f apps/web/Dockerfile \
  --build-arg NEXT_PUBLIC_API_URL=https://api.example.com \
  -t liberia-works-web .
```

## Database migrations (Docker)

```bash
# Apply migrations
docker compose run --rm api sh -c 'node_modules/.bin/prisma migrate deploy'

# Open Prisma Studio
docker compose run --rm -p 5555:5555 api sh -c 'node_modules/.bin/prisma studio'
```
