# Puro Barbershop — Build Tracker

> Maintained by the coding agent. Updated after every commit.
> Cross-reference: `docs/PURO_BARBERSHOP_BUILD_PLAN.md`

---

## Project notes

| Item            | Detail                                                                                            |
| --------------- | ------------------------------------------------------------------------------------------------- |
| Next.js version | **16.2.9** (plan specified 15+; 16 is the installed version — newer, same App Router conventions) |
| React           | 19.2.4                                                                                            |
| TypeScript      | 5.x                                                                                               |
| Node target     | 20 LTS (.nvmrc)                                                                                   |
| Started         | 2026-06-21                                                                                        |

---

## Phase 1 — Foundation

### Commit 1: Tooling, lint, formatting, docker-compose

**Status:** ✅ DONE

**Changes:**

- `tsconfig.json` — added `noUncheckedIndexedAccess`, `noImplicitOverride`, `exactOptionalPropertyTypes`, `noFallthroughCasesInSwitch` (strict was already on)
- `eslint.config.mjs` — added `eslint-plugin-security`, `@typescript-eslint/eslint-plugin`, `eslint-config-prettier`
- `.prettierrc` + `prettier-plugin-tailwindcss` — formatting configured
- `husky` + `lint-staged` — pre-commit hook (lint + typecheck on staged files)
- `.editorconfig` — consistent editor settings
- `README.md` — full setup guide including docker-compose usage
- `docs/SECURITY.md` — security policy and reference to build plan §6
- `package.json` — full scripts block (dev, build, lint, typecheck, format, db:_, test, docker:_)
- `docker-compose.yml` — Postgres 16, Redis 7, Mailpit
- `.dockerignore`
- `.nvmrc` — pinned to 20

**Deviations / notes:**

- No docker-compose reference file was found alongside the build plan; created from scratch following the plan's spec (Postgres 16, Redis 7, Mailpit with port 8025).
- `.gitignore` already covered `.env.local` via `.env*` glob — no change needed.

**Definition of Done:**

- [x] `npm run dev` starts at localhost:3000
- [x] `npm run lint` passes
- [x] `npm run typecheck` passes
- [x] `npm run format:check` passes
- [x] Pre-commit hook rejects lint errors
- [x] `docker compose up -d` brings up Postgres (5432), Redis (6379), Mailpit (8025)

---

### Commit 2: Type-safe env + folder scaffolding

**Status:** ✅ DONE

**Changes:**

- Installed `@t3-oss/env-nextjs`, `zod`
- `src/lib/env.ts` — Zod-validated env schema for all 20+ variables (server + client)
- `.env.example` — all vars documented with dev defaults
- `.gitignore` — updated to only ignore `.env.local` (not `.env.example`)
- Installed `clsx`, `tailwind-merge`; `src/lib/utils.ts` with `cn()` helper
- Full directory tree scaffolded — every folder from §3 of the build plan exists with placeholder `export {}` files
- `messages/bg.json` + `messages/en.json` — empty namespace stubs for next-intl

**Deviations / notes:**

- Added `SEED_ADMIN_PASSWORD` to env schema (Commit 3 requirement)

**Definition of Done:**

- [x] Importing `env` from `@/lib/env` provides typed, validated env access
- [x] Removing a required env var causes `npm run build` to fail with a clear error

---

### Commit 3: Database schema, migrations, seed

**Status:** ✅ DONE

**Changes:**

- **Packages installed:**
  - Production: `drizzle-orm`, `@neondatabase/serverless`, `postgres`, `bcryptjs`
  - Dev: `drizzle-kit`, `tsx`, `@types/bcryptjs`, `dotenv`
- **`drizzle.config.ts`** — points schema at `src/db/schema.ts`, migrations at `drizzle/migrations/`, uses `DATABASE_URL_UNPOOLED` for migration runs. Uses `dotenv/config` for env loading.
- **`src/db/schema.ts`** — full schema from §7 verbatim:
  - 8 tables: `users`, `barbers`, `services`, `working_hours`, `time_off`, `bookings`, `settings`, `email_blacklist`
  - 2 enums: `user_role` (super_admin, barber), `booking_status` (confirmed, cancelled, completed, no_show)
  - **CRITICAL:** Partial unique index `barber_slot_unique` on `(barberId, startDatetime) WHERE status = 'confirmed'` for double-booking prevention
  - All foreign keys defined with appropriate cascade/set null behavior
- **`src/db/index.ts`** — env-driven client:
  - If `DATABASE_URL` contains `neon.tech` → uses `@neondatabase/serverless` + `drizzle-orm/neon-serverless`
  - Otherwise → uses `postgres` package + `drizzle-orm/postgres-js` (for local docker)
- **Migration generated:** `drizzle/migrations/0000_silent_ezekiel.sql`
- **`drizzle/seed.ts`** — inserts:
  - 1 super admin user (`admin@purobarbershop.com`, password from `SEED_ADMIN_PASSWORD` env var, bcrypt cost 12, aborts if missing or < 16 chars)
  - 2 placeholder barbers (`[PLACEHOLDER:barber_1_name]`, `[PLACEHOLDER:barber_2_name]`)
  - 4 services: Haircut (30min), Haircut+Beard (45min), Beard trim (20min), Kids haircut (30min) — all prices `0.00` (`[PLACEHOLDER:price]`)
  - Working hours: Mon–Fri 09:00–19:00, Sat 09:00–17:00, Sun closed — for each barber
  - Settings: `buffer_minutes=15`, `cancellation_window_hours=24`, `booking_horizon_days=60`, `slot_granularity_minutes=15`
  - `TODO(human):` comment to change admin password on first login
- **`drizzle/reset.ts`** — drops and recreates local dev DB:
  - Refuses to run if `DATABASE_URL` contains `neon.tech` (prints error, exits 1)
  - Drops all tables, enums, and migration tracking
  - Re-runs migrations via `drizzle-kit migrate`
  - Re-runs seed via `tsx drizzle/seed.ts`
- **`.env.local`** — created with dev defaults (gitignored)
- **`.env`** — created for drizzle-kit (gitignored; added `.env` to `.gitignore`)

**Deviations / notes:**

- `postgres` npm package requires URL passed as first argument (not `{ url: ... }`) — this is how the `postgres-js` driver works
- Used `drizzle-orm/postgres-js` driver (not `node-postgres`) because the `postgres` npm package is the postgres-js driver
- `sql` import must come from `drizzle-orm`, not `drizzle-orm/pg-core` — the partial unique index requires `sql` tagged template
- Price placeholder `[PLACEHOLDER:price]` cannot be stored in a `decimal` column — used `0.00` with inline TODO comments
- `noUncheckedIndexedAccess` caused `DB_URL` and `seedPassword` to be `string | undefined` — added explicit guards and `as string` casts after validation
- `drizzle.config.ts` reads from `process.env` directly (not through `@/lib/env`) to avoid requiring all env vars for migration operations
- Added `dotenv` as dev dependency for drizzle-kit and seed scripts to load `.env` / `.env.local`

**Definition of Done:**

- [x] `npm run db:generate` creates migration SQL
- [x] `npm run db:migrate` applies migration successfully
- [x] `npm run db:seed` inserts all seed data
- [x] `npm run db:reset` drops, migrates, and seeds cleanly
- [x] `npm run db:reset` refuses to run against Neon URL
- [x] `npm run lint` passes
- [x] `npm run typecheck` passes
- [x] Double-booking prevention index exists in migration SQL

---

### Commit 4: Design tokens, fonts, base layout, header & footer

**Status:** ✅ DONE

**Changes:**

- `src/app/globals.css` — brand color tokens (dark theme, champagne `#c9a961` accent), merged with shadcn CSS variable infrastructure
- `src/app/layout.tsx` — Cormorant Garamond (headings) + Inter (body) via `next/font/google`, Geist as `--font-sans` (shadcn default)
- `src/app/[locale]/layout.tsx` — header + footer + sonner Toaster wrapper
- `src/components/shared/Header.tsx` — logo left, nav center (Начало, Услуги, Галерия, Местоположение, Запази час), language switcher right, mobile hamburger menu
- `src/components/shared/Footer.tsx` — slogan, address, hours, quick links, legal links, copyright with current year
- `src/components/shared/SloganDivider.tsx` — "Precision · Confidence · Clean Look" triple-beat element
- `src/app/[locale]/(public)/page.tsx` — placeholder homepage with heading + slogan divider
- `public/logo.svg` — placeholder logo (to be replaced by real brand asset)
- `src/middleware.ts` — minimal valid export to satisfy Next.js build
- shadcn/ui initialized via `npx shadcn init -d`
- Pre-installed shadcn components: button, sonner

**Deviations / notes:**

- shadcn/ui v4 uses `oklch` color space by default; our brand tokens were converted to hex-compatible values for the dark theme
- Removed `next-themes` dependency from sonner wrapper (we don't need light/dark toggle — dark only)
- `weights` → `weight` in font config (TypeScript strict mode)
- `exactOptionalPropertyTypes` caused issues with sonner `ToasterProps`; simplified to direct usage

**Definition of Done:**

- [x] `npm run build` succeeds
- [x] `npm run lint` passes
- [x] `npm run typecheck` passes
- [x] `/` shows styled page with header, footer, and slogan divider
- [x] Mobile menu works at 375px width
- [x] Self-hosted fonts only (no Google Fonts `<link>` requests)

---

## Phase 2 — Public site

### Commit 5: Localization (next-intl)

**Status:** 🔲 TODO

### Commit 6: Homepage sections

**Status:** 🔲 TODO

### Commit 7: Instagram gallery (click-to-load)

**Status:** 🔲 TODO

### Commit 8: Legal pages

**Status:** 🔲 TODO

---

## Phase 3 — Booking system

### Commit 9: Availability engine

**Status:** 🔲 TODO

### Commit 10: Booking UI

**Status:** 🔲 TODO

### Commit 11: Booking server action

**Status:** 🔲 TODO

### Commit 12: Emails + cancellation flow

**Status:** 🔲 TODO

---

## Phase 4 — Admin system

### Commit 13: Auth.js setup + login

**Status:** 🔲 TODO

### Commit 14: Admin layout + dashboard

**Status:** 🔲 TODO

### Commit 15: Schedule view

**Status:** 🔲 TODO

### Commit 16: Time off management

**Status:** 🔲 TODO

### Commit 17: Super admin CRUD

**Status:** 🔲 TODO

---

## Phase 5 — Compliance & analytics

### Commit 18: Cookie info page

**Status:** 🔲 TODO

### Commit 19: SEO, structured data, sitemap

**Status:** 🔲 TODO

---

## Phase 6 — Production readiness

### Commit 20: Cron jobs

**Status:** 🔲 TODO

### Commit 21: Security headers, CSP

**Status:** 🔲 TODO

### Commit 22: E2E test, CI/CD, README

**Status:** 🔲 TODO

---

## Blockers / Human-action required

| #   | Description                                                                                          | Status           |
| --- | ---------------------------------------------------------------------------------------------------- | ---------------- |
| B1  | Neon database — human must sign up and provide `DATABASE_URL` and `DATABASE_URL_UNPOOLED` (Commit 3) | 🔲 Pending human |
| B2  | Resend API key — human must create account and provide `RESEND_API_KEY` (Commit 12)                  | 🔲 Pending human |
| B3  | Upstash Redis credentials — human must create free account (Commit 11)                               | 🔲 Pending human |
| B4  | Cloudinary account + upload preset — human must configure for barber photos (Commit 17)              | 🔲 Pending human |
| B5  | LightWidget account + widget ID for Instagram embed (Commit 7)                                       | 🔲 Pending human |
| B6  | Real photography: hero image, barber photos (Commit 6+)                                              | 🔲 Pending human |
| B7  | Google Maps embed URL / map pin for the shop                                                         | 🔲 Pending human |
| B8  | Shop phone, email, legal entity name, EIK/VAT, registered address                                    | 🔲 Pending human |

---

## PLACEHOLDER grep targets

Run `grep -r "PLACEHOLDER"` at any time to find all spots awaiting human data.

---

## Security checklist (per §6 of build plan)

Checked at each commit. Full checklist in `docs/PURO_BARBERSHOP_BUILD_PLAN.md` §6.
