# Puro Barbershop — Website

Booking website for Puro Barbershop, Plovdiv, Bulgaria.  
Built with Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Drizzle ORM, Auth.js v5.

---

## Prerequisites

- **Node 20 LTS** (use `.nvmrc` — run `nvm use` if you have nvm)
- **Docker Desktop** (for local Postgres, Redis, Mailpit)
- **npm** (comes with Node)

---

## Local setup

### 1. Clone and install

```bash
git clone <repo-url>
cd puro-barbershop
nvm use        # or ensure node --version matches .nvmrc
npm install
```

### 2. Environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in the required values.  
For local development, the docker-compose defaults below work out of the box.

```env
DATABASE_URL=postgresql://puro:puro_dev_only@localhost:5432/puro_barbershop
DATABASE_URL_UNPOOLED=postgresql://puro:puro_dev_only@localhost:5432/puro_barbershop
AUTH_SECRET=<generate with: openssl rand -base64 32>
```

All other keys are optional for pure UI development but required for booking, email, and admin features.

### 3. Start docker services

```bash
npm run docker:up
```

This starts:

- **Postgres 16** on port `5432`
- **Redis 7** on port `6379`
- **Mailpit** (email catcher) on port `8025` — open http://localhost:8025 to view emails

Wait until all three containers report `healthy`:

```bash
docker compose ps
```

### 4. Run database migrations and seed

```bash
npm run db:migrate
npm run db:seed
```

The seed creates:

- Super admin: `admin@purobarbershop.com` (password from `SEED_ADMIN_PASSWORD` env var)
- 2 placeholder barbers
- 4 placeholder services
- Default working hours

**Change the admin password immediately after first login.**

### 5. Start the dev server

```bash
npm run dev
```

Open http://localhost:3000.

---

## Available scripts

| Script                 | Description                                                                   |
| ---------------------- | ----------------------------------------------------------------------------- |
| `npm run dev`          | Start Next.js dev server with Turbopack                                       |
| `npm run build`        | Production build                                                              |
| `npm run start`        | Start production server                                                       |
| `npm run lint`         | ESLint check                                                                  |
| `npm run lint:fix`     | ESLint with auto-fix                                                          |
| `npm run typecheck`    | TypeScript type check (no emit)                                               |
| `npm run format`       | Prettier format all files                                                     |
| `npm run format:check` | Prettier check (CI mode)                                                      |
| `npm run db:generate`  | Generate Drizzle migration from schema                                        |
| `npm run db:migrate`   | Apply pending migrations                                                      |
| `npm run db:push`      | Push schema directly (dev only)                                               |
| `npm run db:studio`    | Open Drizzle Studio                                                           |
| `npm run db:seed`      | Seed dev database                                                             |
| `npm run db:reset`     | Drop and recreate dev DB + re-migrate + re-seed (**never runs against Neon**) |
| `npm run test`         | Run Vitest unit tests                                                         |
| `npm run test:e2e`     | Run Playwright E2E tests                                                      |
| `npm run docker:up`    | Start docker services (detached)                                              |
| `npm run docker:down`  | Stop docker services                                                          |

---

## Tech stack

| Layer         | Technology                    |
| ------------- | ----------------------------- |
| Framework     | Next.js 16 (App Router, RSC)  |
| Language      | TypeScript (strict)           |
| Styling       | Tailwind CSS v4 + shadcn/ui   |
| Database      | Neon (Postgres) + Drizzle ORM |
| Auth          | Auth.js v5 (Credentials)      |
| Email         | Resend (prod) / Mailpit (dev) |
| i18n          | next-intl (bg/en)             |
| Rate limiting | Upstash Redis                 |
| Validation    | Zod + @t3-oss/env-nextjs      |
| Testing       | Vitest + Playwright           |

---

## Locales

The site supports Bulgarian (`bg`, default) and English (`en`).  
All URLs are prefixed: `/bg/...` and `/en/...`. Visiting `/` redirects to `/bg`.

---

## Deployment (Vercel)

1. Connect the GitHub repository in Vercel
2. Set environment variables in Vercel dashboard (see `.env.example` for the full list)
3. Set `DATABASE_URL` to the **pooled** Neon connection string
4. Set `DATABASE_URL_UNPOOLED` to the **unpooled** Neon connection string (migrations only)
5. Enable Vercel Cron Jobs for the reminder and retention endpoints

See `docs/PURO_BARBERSHOP_BUILD_PLAN.md` §9 for the full pre-launch checklist.

---

## Security

See `docs/SECURITY.md`. Report vulnerabilities privately — do not open public issues.

---

## Build tracker

See `docs/TRACKER.md` for phase-by-phase progress, blockers, and notes.
