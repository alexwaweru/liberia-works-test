# Build context must be the monorepo root:
#   docker build -f apps/web/Dockerfile .
FROM node:20-alpine AS base
RUN apk add --no-cache git
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# ── deps: install all workspace dependencies ──────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json tsconfig.base.json ./
COPY apps/web/package.json apps/web/tsconfig.json ./apps/web/
COPY packages/shared/package.json            ./packages/shared/
COPY packages/shared-schemas/package.json    ./packages/shared-schemas/
COPY packages/shared-types/package.json      ./packages/shared-types/
COPY packages/shared-utils/package.json      ./packages/shared-utils/
RUN pnpm install --frozen-lockfile

# ── builder: compile packages and Next.js app ─────────────────────────────────
FROM deps AS builder
WORKDIR /app
ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
COPY . .
RUN pnpm --filter "@liberia-works/shared*" run build && \
    pnpm --filter @liberia-works/web run build

# ── runner: minimal Next.js standalone image ──────────────────────────────────
# next.config.ts sets output:'standalone', which produces a self-contained
# server at .next/standalone/apps/web/server.js with trimmed node_modules.
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# Standalone bundle (includes its own trimmed node_modules)
COPY --from=builder /app/apps/web/.next/standalone ./

# Static assets must sit next to where standalone expects them
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static

EXPOSE 3000
CMD ["node", "apps/web/server.js"]
