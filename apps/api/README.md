# @liberia-works/api

Fastify REST API for the Liberia Works platform. Serves all domains — authentication, individual and employer profiles, vacancies, applications, work permits, disputes, vacation jobs, messaging, notifications, and the MoL dashboard.

## Tech stack

| Layer | Technology |
|-------|-----------|
| Framework | Fastify 5 with Zod type provider |
| Database | PostgreSQL 16 via Prisma 6 |
| Cache / queues | Redis 7 + BullMQ 5 |
| Auth | JWT (httpOnly cookies), 15 min access / 30 day refresh |
| File storage | DigitalOcean Spaces (S3-compatible, pre-signed client uploads) |
| SMS / WhatsApp | Africa's Talking |
| Email | Resend |
| CV parsing | OpenAI GPT-4o via BullMQ worker |
| API docs | Swagger UI at `/documentation` |
| Testing | Vitest |

## Running locally

From the **monorepo root**:

```bash
pnpm install
cp .env.example .env

# Start PostgreSQL and Redis
docker compose up postgres redis -d

# Generate Prisma client
pnpm --filter @liberia-works/api db:generate

# Create and apply migrations (dev)
pnpm --filter @liberia-works/api db:migrate:dev

# Seed reference data
pnpm --filter @liberia-works/api db:seed

# Seed location data
pnpm --filter @liberia-works/api db:seed:locations

# Start the API in watch mode
pnpm --filter @liberia-works/api dev
```

The API listens on `http://localhost:3001` by default.

## Scripts

| Script | Command |
|--------|---------|
| `dev` | `tsx watch src/server.ts` |
| `build` | `tsc` → `dist/` |
| `start` | `node dist/server.js` |
| `typecheck` | `tsc --noEmit` |
| `test` | `vitest run` |
| `db:generate` | `prisma generate` |
| `db:migrate:dev` | `prisma migrate dev` |
| `db:migrate` | `prisma migrate deploy` |
| `db:seed` | `tsx prisma/seed.ts` |
| `db:studio` | `prisma studio` |

## Environment variables

| Variable | Description |
|----------|-------------|
| `NODE_ENV` | `development` / `production` |
| `PORT` | API port (default `3001`) |
| `HOST` | Bind address (default `0.0.0.0`) |
| `LOG_LEVEL` | Fastify log level (`info`, `debug`, etc.) |
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `JWT_SECRET` | Min 32-character secret |
| `JWT_ACCESS_EXPIRES_IN` | Access token TTL (e.g. `15m`) |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token TTL (e.g. `30d`) |
| `AT_API_KEY` | Africa's Talking API key |
| `AT_USERNAME` | Africa's Talking username |
| `AT_SENDER_ID` | Africa's Talking sender ID |
| `DO_SPACES_KEY` | DigitalOcean Spaces access key |
| `DO_SPACES_SECRET` | DigitalOcean Spaces secret |
| `DO_SPACES_ENDPOINT` | e.g. `https://fra1.digitaloceanspaces.com` |
| `DO_SPACES_BUCKET` | Bucket name |
| `DO_SPACES_REGION` | e.g. `fra1` |
| `OPENAI_API_KEY` | OpenAI key for CV parsing |
| `RESEND_API_KEY` | Resend key for email delivery |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins |
| `SENTRY_DSN` | Sentry DSN for error tracking |

## Route modules

All routes are mounted under `/api/v1`.

| Module | Prefix | Roles | Purpose |
|--------|--------|-------|---------|
| reference | `/reference` | public | Counties, sectors, occupations, countries, education levels |
| accounts | `/auth` | public + all | OTP registration, login, logout, token refresh, `/me` |
| individuals | `/individuals` | INDIVIDUAL | Profile, education, work history, skills, sector interests |
| employers | `/employers` | EMPLOYER_ADMIN / HR | Company profile, team members, user invites |
| documents | `/documents` | authenticated | Document vault, pre-signed S3 uploads, CV parse trigger |
| vacancies | `/vacancies` | EMPLOYER / public | Job postings (CRUD), public listing with filters |
| applications | `/applications` | INDIVIDUAL / EMPLOYER | Apply to vacancies, manage application status |
| work-permits | `/work-permits` | EMPLOYER + MOL | Foreign worker permit applications, mandatory advertising check |
| disputes | `/disputes` | EMPLOYER + MOL | Dispute submission, 10 business day SLA tracking |
| vacation-jobs | `/vacation-jobs` | INDIVIDUAL / MOL | Cycle management, opt-in, placements |
| messaging | `/webhooks` | system | Africa's Talking inbound SMS/WhatsApp, bot flows |
| notifications | `/notifications` | authenticated | In-app notification feed, multi-channel dispatch |
| ai | `/cv-parse-jobs` | INDIVIDUAL | CV parsing job status |
| mol | `/mol` | MOL_OFFICER / DIRECTOR | KPI dashboard, employer/dispute/permit queues |
| audit | `/audit-log` | MOL_DIRECTOR / ADMIN | Immutable audit trail queries |

Health check: `GET /health`

## Architecture notes

**Authentication** uses an OTP flow for individuals (SMS/WhatsApp via Africa's Talking) and email+password for employers and MoL staff. JWTs are stored in httpOnly cookies; the access token is 15 minutes and refreshed transparently using a 30-day refresh token stored server-side.

**RBAC** is enforced at two levels: route-level via a `requireRole()` Fastify preHandler, and business-logic level inside route handlers.

**Mandatory advertising** (Regulation RL/MOL/CWK/M/1011/725): work permit applications must reference a vacancy flagged `isMandatoryAdvertised = true` that has been posted for at least 60 days in the same occupation group.

**CV parsing** is asynchronous. Uploading a CV document triggers a BullMQ job that calls GPT-4o. Status is polled via the `/ai/cv-parse-jobs/:id` endpoint.

**Audit log** rows are append-only at the database level — a Postgres rule revokes `UPDATE` and `DELETE` on the `audit_log` table for the application role.

**Message retention**: message bodies are anonymised at `retention_expires_at` via a scheduled BullMQ job to comply with data minimisation requirements.

## Docker

Build from the monorepo root (the Dockerfile requires the workspace context):

```bash
docker build -f apps/api/Dockerfile -t liberia-works-api .
docker run --env-file .env -p 3001:3001 liberia-works-api
```

The image runs `prisma migrate deploy` before starting the server when launched via `docker compose`.
