.PHONY: dev-infra dev-backend dev-frontend db-studio db-migrate db-seed help up

# Default target
help:
	@echo "Available commands:"
	@echo "  make dev-infra     - Start database and redis in background"
	@echo "  make dev-backend   - Start the backend API (requires infra)"
	@echo "  make dev-frontend  - Start the frontend web app"
	@echo "  make db-studio     - Open Prisma Studio"
	@echo "  make db-migrate    - Run database migrations"
	@echo "  make db-seed       - Seed the database with all required data"
	@echo "  make up            - Start all Docker services"

# Infrastructure
dev-infra:
	docker compose up -d postgres redis

# Backend
dev-backend:
	cd apps/api && pnpm run dev

# Frontend
dev-frontend:
	cd apps/web && pnpm run dev

# Database Management
# We add & to run in background so it doesn't hang the terminal, 
# and use a wrapper to capture output for debugging if it crashes.
db-studio:
	docker compose exec -d api sh -c "cd apps/api && npx prisma studio --port 5555 --browser none > studio.log 2>&1"
	@echo "Prisma Studio started in background. Check studio.log inside the container if it fails."

db-migrate:
	docker compose exec api sh -c "cd apps/api && npx prisma migrate deploy"

db-seed:
	docker compose exec api sh -c "cd apps/api && npx tsx prisma/seed-locations.ts && npx tsx prisma/seed.ts"
	@echo "Base seeds applied."

# Full stack start
up:
	docker compose up -d --build
