# Build context must be the monorepo root:
#   docker build -f apps/api/Dockerfile .
FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# ── deps: install all workspace dependencies ──────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json tsconfig.base.json ./
COPY apps/api/package.json apps/api/tsconfig.json ./apps/api/
COPY packages/shared/package.json            ./packages/shared/
COPY packages/shared-schemas/package.json    ./packages/shared-schemas/
COPY packages/shared-types/package.json      ./packages/shared-types/
COPY packages/shared-utils/package.json      ./packages/shared-utils/
RUN pnpm install --frozen-lockfile

# ── builder: compile packages and API ─────────────────────────────────────────
FROM deps AS builder
WORKDIR /app
COPY . .
RUN pnpm --filter "@liberia-works/shared*" run build && \
    pnpm --filter @liberia-works/api run db:generate && \
    pnpm --filter @liberia-works/api run build

# ── runner: production image ──────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy the pnpm virtual store and workspace symlinks (includes prod + dev deps;
# dev deps are intentionally kept so `prisma migrate deploy` works at startup).
COPY --from=builder /app/node_modules          ./node_modules
COPY --from=builder /app/package.json          ./package.json
COPY --from=builder /app/pnpm-workspace.yaml   ./pnpm-workspace.yaml

# Shared packages (their dist/ is imported via pnpm workspace symlinks)
COPY --from=builder /app/packages              ./packages

# API application
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/apps/api/dist         ./apps/api/dist
COPY --from=builder /app/apps/api/prisma       ./apps/api/prisma
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json

WORKDIR /app/apps/api
EXPOSE 3001
CMD ["node", "dist/server.js"]
