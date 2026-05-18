.PHONY: dev-infra dev-api dev-web dev-inngest db-studio db-migrate db-seed help

# Default target
help:
	@echo "Available commands:"
	@echo "  make dev-infra     - Start Postgres + Redis + pgadmin (Docker)"
	@echo "  make dev-api       - Run the Fastify API natively (pnpm)"
	@echo "  make dev-web       - Run the Next.js web app natively (pnpm)"
	@echo "  make dev-inngest   - Run the Inngest dev server (UI: http://localhost:8288)"
	@echo "  make db-studio     - Open Prisma Studio"
	@echo "  make db-migrate    - Run Prisma migrations against the local DB"
	@echo "  make db-seed       - Seed the local DB"

# Infrastructure — Postgres + Redis + pgadmin via Docker.
# The api + web run natively so the dev experience matches Vercel.
dev-infra:
	docker compose up -d postgres redis pgadmin

dev-api:
	cd apps/api && pnpm run dev

dev-web:
	cd apps/web && pnpm run dev

# Inngest dev server discovers `/api/inngest` on the local API automatically.
dev-inngest:
	npx inngest-cli@latest dev

db-studio:
	cd apps/api && pnpm run db:studio

db-migrate:
	cd apps/api && pnpm run db:migrate:dev

db-seed:
	cd apps/api && pnpm run db:seed:locations && pnpm run db:seed
	@echo "Base seeds applied."
