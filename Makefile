# Puro Barbershop — dev helper
# Requires: Docker Desktop, make (Git Bash / WSL / macOS)
#
# Two workflows:
#   Full Docker  — everything in containers (HMR slow on Windows/Mac, see docs)
#   Hybrid       — services in Docker, Next.js runs locally (fast HMR)

.PHONY: help setup dev init up down build rebuild logs shell \
        migrate seed reset typecheck test

COMPOSE = docker compose

.DEFAULT_GOAL := help

help:
	@echo ""
	@echo "  Puro Barbershop dev commands"
	@echo ""
	@echo "  Full Docker stack (HMR may be slow on Windows/Mac):"
	@echo "    make dev        First-run: build + start everything + migrate + seed"
	@echo "    make up         Start all containers"
	@echo "    make down       Stop all containers"
	@echo "    make build      Build the app image"
	@echo "    make rebuild    Force-rebuild the app image (after package.json changes)"
	@echo "    make logs       Follow app logs"
	@echo "    make shell      Shell into the running app container"
	@echo ""
	@echo "  Hybrid (recommended on Windows/Mac — fast HMR):"
	@echo "    make setup      Copy .env.example → .env.local if missing"
	@echo "    make init       Start services + migrate + seed, then run npm run dev"
	@echo "    make services   Start only postgres/redis/mailpit"
	@echo ""
	@echo "  Database:"
	@echo "    make migrate    Run pending migrations"
	@echo "    make seed       Create admin user"
	@echo "    make reset      Drop all tables, migrate, and seed"
	@echo ""
	@echo "  Code quality:"
	@echo "    make typecheck  TypeScript type check"
	@echo "    make test       Unit tests"
	@echo ""

# ── Full Docker stack ─────────────────────────────────────────────────────────

dev:
	$(COMPOSE) build app
	$(COMPOSE) up -d postgres redis mailpit
	$(COMPOSE) run --rm app npm run db:migrate
	$(COMPOSE) run --rm app npm run db:seed
	$(COMPOSE) up -d app
	@echo ""
	@echo "  App     → http://localhost:3000/bg"
	@echo "  Admin   → http://localhost:3000/bg/admin  (password: DevPuroAdmin2026!Secure)"
	@echo "  Mailpit → http://localhost:8025"
	@echo ""

up:
	$(COMPOSE) up -d

down:
	$(COMPOSE) down

build:
	$(COMPOSE) build app

rebuild:
	$(COMPOSE) build --no-cache app

logs:
	$(COMPOSE) logs -f app

shell:
	$(COMPOSE) exec app sh

# ── Hybrid (local Next.js + Docker services) ──────────────────────────────────

setup:
	@if [ ! -f .env.local ]; then \
		cp .env.example .env.local; \
		echo "Created .env.local — fill in AUTH_SECRET, CRON_SECRET, SEED_ADMIN_PASSWORD."; \
	else \
		echo ".env.local already exists."; \
	fi

services:
	$(COMPOSE) up -d postgres redis mailpit

init: services
	npm run db:migrate
	npm run db:seed
	@echo ""
	@echo "  Services running. Start the app with: npm run dev"
	@echo "  App     → http://localhost:3000/bg"
	@echo "  Admin   → http://localhost:3000/bg/admin"
	@echo "  Mailpit → http://localhost:8025"
	@echo ""

# ── Database ──────────────────────────────────────────────────────────────────

migrate:
	$(COMPOSE) run --rm app npm run db:migrate

seed:
	$(COMPOSE) run --rm app npm run db:seed

reset:
	$(COMPOSE) run --rm app npm run db:reset
	$(COMPOSE) run --rm app npm run db:migrate
	$(COMPOSE) run --rm app npm run db:seed

# ── Code quality ──────────────────────────────────────────────────────────────

typecheck:
	$(COMPOSE) run --rm app npm run typecheck

test:
	$(COMPOSE) run --rm app npm run test
