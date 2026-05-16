# Build context must be the monorepo root:
#   docker build -f apps/api/Dockerfile .
FROM node:20-alpine AS base
RUN apk add --no-cache git
RUN git config --global url."https://github.com/".insteadOf "git@github.com:"
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
# Install pnpm directly via npm (more reliable than corepack's lazy fetch,
# which has a short timeout and fails on slow networks).
RUN npm install -g pnpm@9.15.4

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
# dev deps are intentionally kept so the App Platform pre-deploy migrate job
# — which reuses this image — can run `pnpm exec prisma migrate deploy`).
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
# Migrations run as an App Platform pre-deploy job (see .do/app.yaml), not here.
CMD ["node", "dist/server.js"]
