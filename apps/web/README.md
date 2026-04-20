# @liberia-works/web

Next.js 16 frontend for the Liberia Works platform. Serves three distinct user roles — Individuals (job seekers), Employers, and Ministry of Labour staff — each with their own protected route group enforced by middleware.

## Tech stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| UI | React 19 |
| Styling | Tailwind CSS 3 + @tailwindcss/forms |
| Forms | React Hook Form + @hookform/resolvers |
| Data fetching | TanStack React Query v5 |
| Validation | Zod (shared with API via `@liberia-works/shared-schemas`) |
| Testing | Vitest |

## Running locally

From the **monorepo root**:

```bash
pnpm install
cp .env.example .env          # set NEXT_PUBLIC_API_URL

# Start the API (needed for the frontend to work)
pnpm --filter @liberia-works/api dev

# Start the web app
pnpm --filter @liberia-works/web dev
```

The app runs on `http://localhost:3000`.

## Scripts

| Script | Command |
|--------|---------|
| `dev` | `next dev --port 3000` |
| `build` | `next build` |
| `start` | `next start` |
| `typecheck` | `tsc --noEmit` |
| `lint` | `next lint` |
| `test` | `vitest run` |

## Environment variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Base URL of the API (e.g. `http://localhost:3001`) |

`NEXT_PUBLIC_` variables are baked into the client bundle at build time. Pass the correct URL when building the Docker image for staging/production.

## Route structure

Authentication is enforced by `src/middleware.ts`, which checks for a valid `access_token` cookie and redirects unauthenticated users to `/auth/login`.

```
app/
├── (public)/               No authentication required
│   ├── page.tsx            Homepage
│   └── jobs/page.tsx       Public job listing
├── auth/
│   ├── login/page.tsx
│   ├── register/page.tsx
│   └── verify-otp/page.tsx
├── (individual)/           Requires role: INDIVIDUAL
│   ├── profile/page.tsx
│   ├── applications/page.tsx
│   └── vacation-job/page.tsx
├── (employer)/             Requires role: EMPLOYER_ADMIN or EMPLOYER_HR
│   ├── dashboard/page.tsx
│   ├── vacancies/page.tsx
│   ├── disputes/page.tsx
│   └── work-permits/page.tsx
└── (mol)/                  Requires role: MOL_OFFICER or MOL_DIRECTOR
    ├── overview/page.tsx
    ├── employers/page.tsx
    ├── disputes/page.tsx
    └── work-permits/page.tsx
```

## Architecture notes

**Shared packages** — `@liberia-works/shared-schemas`, `@liberia-works/shared-types`, and `@liberia-works/shared-utils` are listed in `transpilePackages` in `next.config.ts` so Next.js processes them directly from source without requiring a separate build step during development.

**Middleware** reads the `access_token` cookie and enforces role-based route access before the request reaches any page component.

**Forms** use React Hook Form with Zod resolvers, reusing the same schemas as the API to keep client and server validation in sync.

**Image CDN** — remote images from `*.digitaloceanspaces.com` are allowed in `next.config.ts`.

## Docker

The image uses Next.js [standalone output](https://nextjs.org/docs/app/api-reference/config/next-config-js/output) (`output: 'standalone'` in `next.config.ts`), which produces a self-contained server with a minimal `node_modules`. Build from the monorepo root:

```bash
docker build -f apps/web/Dockerfile \
  --build-arg NEXT_PUBLIC_API_URL=https://api.example.com \
  -t liberia-works-web .
```

The resulting image is roughly 200–300 MB and runs with:

```bash
docker run -e NEXT_PUBLIC_API_URL=https://api.example.com -p 3000:3000 liberia-works-web
```
