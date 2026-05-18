# @liberia-works/api

Fastify REST API for the Liberia Works platform. Serves all domains — authentication, individual and employer profiles, vacancies, applications, work permits, disputes, vacation jobs, messaging, notifications, and the MoL dashboard.

## Tech stack

| Layer | Technology |
|-------|-----------|
| Framework | Fastify 5 with Zod type provider |
| Database | PostgreSQL 16 via Prisma 7 (Supabase in production) |
| Cache | Redis 7 (Upstash in production) — rate-limit, idempotency, bot session |
| Background jobs | Inngest (event-driven; cron triggers replace repeatable jobs) |
| Auth | JWT (httpOnly cookies), 15 min access / 30 day refresh |
| File storage | Vercel Blob (client-direct uploads via `@vercel/blob/client`) |
| SMS / WhatsApp | Africa's Talking |
| Email | Resend |
| CV parsing | OpenAI GPT-4o via the `cv-parse` Inngest function |
| API docs | Scalar UI at `/documentation` |
| Hosting | Vercel (Fastify wrapped as a single serverless function) |
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

# Seed test data
pnpm --filter @liberia-works/api db:seed:test

# Start the API in watch mode
pnpm --filter @liberia-works/api dev

```

The API listens on `http://localhost:3001` by default.

## Scripts

| Script | Command |
|--------|---------|
| `dev` | `tsx watch src/start.ts` |
| `build` | `tsc` → `dist/` |
| `start` | `node dist/start.js` |
| `typecheck` | `tsc --noEmit` |
| `test` | `vitest run` |
| `db:generate` | `prisma generate` |
| `db:migrate:dev` | `prisma migrate dev` |
| `db:migrate` | `prisma migrate deploy` |
| `db:seed` | `tsx prisma/seed.ts` |
| `db:studio` | `prisma studio` |

`src/start.ts` is the local-dev entry; the Vercel deployment uses `api/index.ts`, which imports `buildApp()` from `src/server.ts`.

## Environment variables

| Variable | Description |
|----------|-------------|
| `NODE_ENV` | `development` / `production` |
| `PORT` | API port (default `3001`, local dev only) |
| `HOST` | Bind address (default `0.0.0.0`, local dev only) |
| `LOG_LEVEL` | Fastify log level (`info`, `debug`, etc.) |
| `DATABASE_URL` | Postgres connection — use Supabase **pooled** URL (port 6543) in prod |
| `DIRECT_URL` | Postgres direct connection (port 5432) — used only by `prisma migrate` |
| `REDIS_URL` | Redis connection (Upstash `rediss://…` in prod) |
| `JWT_SECRET` | Min 32-character secret |
| `JWT_ACCESS_EXPIRES_IN` | Access token TTL (e.g. `15m`) |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token TTL (e.g. `30d`) |
| `AT_API_KEY` | Africa's Talking API key |
| `AT_USERNAME` | Africa's Talking username |
| `AT_SENDER_ID` | Africa's Talking sender ID |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob read/write token (from `vercel blob` CLI or dashboard) |
| `INNGEST_EVENT_KEY` | Inngest event key (signs outbound events) |
| `INNGEST_SIGNING_KEY` | Inngest signing key (verifies inbound requests to `/api/inngest`) |
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

**CV parsing** is asynchronous. Uploading a CV document sends a `cv-parse/start` Inngest event; the corresponding function calls GPT-4o and writes results back. Status is polled via the `/cv-parse-jobs/:id` endpoint.

**Audit log** rows are append-only at the database level — a Postgres rule revokes `UPDATE` and `DELETE` on the `audit_log` table for the application role.

**Message retention**: message bodies are anonymised at `retention_expires_at` via a cron-triggered Inngest function (`0 2 * * *`).

## Deployment (Vercel)

Configured via `vercel.json`. The whole Fastify app is wrapped as a single
serverless function at `api/index.ts`; a catch-all rewrite forwards every path
to it. Set the Vercel project's **Root Directory** to `apps/api` — `vercel.json`
handles install + build (it builds shared workspace packages first, then `tsc`).
Background functions are mounted at `POST /api/inngest`; Inngest cloud discovers
them automatically.

Migrations run from CI (`.github/workflows/deploy.yml`) on push to `main` /
`staging` using `DIRECT_URL` (the Supabase non-pooled connection). The CI step
should land before Vercel's deploy completes, but Vercel's deploy isn't gated
on it — keep schema changes additive.

## Test credentials

> These accounts are created by `pnpm --filter @liberia-works/api db:seed:test` and are for **development only**.

### MoL staff accounts (email + password)

| Full Name | Email | Password | Role |
|-----------|-------|----------|------|
| Sarah Doe | mol-officer1@test.libworks.lr | Test@1234 | MOL_OFFICER |
| Emmanuel Wesseh | mol-officer2@test.libworks.lr | Test@1234 | MOL_OFFICER |
| Patricia Karngbeae | mol-director1@test.libworks.lr | Test@1234 | MOL_DIRECTOR |
| Joseph Tubman | mol-director2@test.libworks.lr | Test@1234 | MOL_DIRECTOR |

MoL staff can access the `/mol/*` admin area, including the program-cycle editor at `/mol/programs` (MOL_OFFICER and MOL_DIRECTOR can edit; `PATCH /api/v1/programs/cycles/:id` enforces these roles).

### Employer accounts (email + password)

| Company | Email | Password | Role |
|---------|-------|----------|------|
| Liberia Steel Corporation | employer1@test.libworks.lr | Test@1234 | EMPLOYER_ADMIN |
| Monrovia Tech Hub | employer2@test.libworks.lr | Test@1234 | EMPLOYER_ADMIN |
| Harbel Sugar Company | employer3@test.libworks.lr | Test@1234 | EMPLOYER_ADMIN |
| Grand Bassa Trading Co. | employer4@test.libworks.lr | Test@1234 | EMPLOYER_ADMIN |
| Roberts International Services | employer5@test.libworks.lr | Test@1234 | EMPLOYER_ADMIN |

### Job seeker accounts (phone OTP or email + password)

Authentication for individuals uses OTP sent to the phone number. In development (`NODE_ENV=development`), OTPs are printed to the console instead of being sent via SMS. All seeded seekers also have an email and password set.

| # | Full Name | Phone | Email | Password |
|---|-----------|-------|-------|----------|
| 1 | James Kollie | +23177100001 | seeker1@test.libworks.lr | Test@1234 |
| 2 | Mary Wleh | +23177100002 | seeker2@test.libworks.lr | Test@1234 |
| 3 | David Togba | +23177100003 | seeker3@test.libworks.lr | Test@1234 |
| 4 | Grace Paye | +23177100004 | seeker4@test.libworks.lr | Test@1234 |
| 5 | Emmanuel Mulbah | +23177100005 | seeker5@test.libworks.lr | Test@1234 |
| 6 | Rebecca Flomo | +23177100006 | seeker6@test.libworks.lr | Test@1234 |
| 7 | Samuel Kollie | +23177100007 | seeker7@test.libworks.lr | Test@1234 |
| 8 | Esther Nimba | +23177100008 | seeker8@test.libworks.lr | Test@1234 |
| 9 | Moses Pewee | +23177100009 | seeker9@test.libworks.lr | Test@1234 |
| 10 | Abigail Konneh | +23177100010 | seeker10@test.libworks.lr | Test@1234 |
| 11 | Thomas Varney | +23177100011 | seeker11@test.libworks.lr | Test@1234 |
| 12 | Naomi Gbor | +23177100012 | seeker12@test.libworks.lr | Test@1234 |
| 13 | Peter Sumo | +23177100013 | seeker13@test.libworks.lr | Test@1234 |
| 14 | Hannah Boakai | +23177100014 | seeker14@test.libworks.lr | Test@1234 |
| 15 | John Tweah | +23177100015 | seeker15@test.libworks.lr | Test@1234 |
| 16 | Comfort Zulu | +23177100016 | seeker16@test.libworks.lr | Test@1234 |
| 17 | Daniel Karnga | +23177100017 | seeker17@test.libworks.lr | Test@1234 |
| 18 | Patience Borbor | +23177100018 | seeker18@test.libworks.lr | Test@1234 |
| 19 | Stephen Cheawe | +23177100019 | seeker19@test.libworks.lr | Test@1234 |
| 20 | Agnes Dahn | +23177100020 | seeker20@test.libworks.lr | Test@1234 |
| 21 | Michael Yancy | +23177100021 | seeker21@test.libworks.lr | Test@1234 |
| 22 | Bertha Kamara | +23177100022 | seeker22@test.libworks.lr | Test@1234 |
| 23 | Joseph Tokpah | +23177100023 | seeker23@test.libworks.lr | Test@1234 |
| 24 | Lydia Gono | +23177100024 | seeker24@test.libworks.lr | Test@1234 |
| 25 | Charles Gongloe | +23177100025 | seeker25@test.libworks.lr | Test@1234 |
