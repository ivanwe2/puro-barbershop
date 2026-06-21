## Goal

Build Puro Barbershop website (Next.js 16, Tailwind v4, Drizzle ORM, next-intl) following the phased plan in `docs/PURO_BARBERSHOP_BUILD_PLAN.md`.

## Constraints & Preferences

- Strict TypeScript (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `noFallthroughCasesInSwitch`)
- Dark theme only; brand accent `#c9a961` (champagne gold)
- Self-hosted fonts via `next/font/google`; no Google Fonts `<link>` requests
- Locale prefix always: `/bg`, `/en`; default locale `bg`
- No third-party iframes on homepage; no analytics; click-to-load for Instagram
- `[PLACEHOLDER:description]` format for human-fillable data; never invent realistic fake data
- `TODO(human):` comments for ambiguities
- Docker Compose for local dev: Postgres 16, Redis 7, Mailpit
- Seed password from `SEED_ADMIN_PASSWORD` env var (≥16 chars), bcrypt cost 12
- `db:reset` must refuse to run against Neon URLs

## Progress

### Done

- **Commit 1** ✅ — Tooling, lint, formatting, docker-compose, husky pre-commit
- **Commit 2** ✅ — Type-safe env (`@t3-oss/env-nextjs` + zod), folder scaffolding, `cn()` helper, i18n message stubs
- **Commit 3** ✅ — Drizzle schema (8 tables, 2 enums, partial unique index for double-booking prevention), env-driven DB client (Neon serverless vs postgres-js), migrations, seed, reset
- **Commit 4** ✅ — Design tokens, Cormorant Garamond + Inter fonts, Header (hamburger), Footer, SloganDivider, shadcn/ui init
- **Commit 5** ✅ — next-intl localization foundation: middleware, request config, routing, full bg/en translations for all 11 namespaces, i18n-aware Header/Footer/SloganDivider
- **Commit 6** ✅ — Homepage sections: Hero, About, BarbersSection (DB-driven), ServicesSection (DB-driven), GalleryPlaceholder, LocationSection (DB-driven hours), CTA strip

### In Progress

- (none)

### Blocked

- (none)

## Key Decisions

- Used `postgres` npm package + `drizzle-orm/postgres-js` driver (not `pg` + `node-postgres`) for local dev; URL must be passed as first string arg, not `{ url: ... }`
- `sql` for partial unique index imported from `drizzle-orm`, not `drizzle-orm/pg-core`
- `i18n/request.ts` must live at repo root (not `src/lib/i18n/`) — next-intl v4 requirement
- `Link` from `createNavigation` is a client component → Header and Footer are `"use client"`
- `getTranslations` returns `Promise<Translator>`; server components pass resolved translator as props to child server components using a simple `T` interface
- `db` export typed implicitly via conditional expression to avoid union type mismatch with `NeonDatabase` vs `NeonHttpDatabase`
- Price placeholder stored as `"0.00"` (decimal column) with inline `TODO(human):` comments
- `<a>` to internal routes replaced with `next/link` `Link` to pass `@next/next/no-html-link-for-pages` lint rule

## Next Steps

- Commit 7: Instagram gallery with click-to-load (LightWidget)
- Commit 8: Legal pages (privacy, terms, cookies)
- Commit 9: Availability engine
- Commit 10: Booking UI
- Commit 11: Booking server action + rate limiting
- Commit 12: Emails + cancellation flow
- Commit 13: Auth.js setup + login
- Commit 14+: Admin dashboard and remaining phases

## Critical Context

- `npm run build` passes cleanly
- `.env` and `.env.local` both exist; `.env` was created for drizzle-kit; both are gitignored
- Docker Desktop starts on-demand on this machine; `npm run docker:up` works after Docker daemon is ready
- `noUncheckedIndexedAccess` causes `process.env.X` to be `string | undefined`; explicit guards + `as string` casts needed after validation
- `components.json` created by shadcn init; `tw-animate-css` and `shadcn/tailwind.css` imported in globals.css
- Geist font retained as `--font-sans` for shadcn compatibility; Cormorant and Inter used for brand headings/body
- `db:reset` uses `npx drizzle-kit migrate` and `npx tsx drizzle/seed.ts` via child_process spawn with `shell: true` — triggers DEP0190 deprecation warning (not blocking)
- Barber bio fields and service description fields are nullable in schema — component interfaces must reflect `string | null`

## Relevant Files

- `docs/PURO_BARBERSHOP_BUILD_PLAN.md`: authoritative build plan with all commit specs
- `docs/TRACKER.md`: phase-by-phase progress tracker (updated per commit)
- `src/db/schema.ts`: full Drizzle schema (8 tables, 2 enums, partial unique index)
- `src/db/index.ts`: env-driven DB client (Neon vs postgres-js)
- `drizzle/seed.ts`: seed script (admin, barbers, services, hours, settings)
- `drizzle/reset.ts`: destructive reset (drops + migrates + seeds; refuses Neon)
- `drizzle.config.ts`: drizzle-kit config with dotenv
- `i18n/request.ts`: next-intl request config (repo root, not src/)
- `src/lib/i18n/config.ts`: locale list and default
- `src/lib/i18n/routing.ts`: `createNavigation` with Link, usePathname, useRouter
- `src/middleware.ts`: `createMiddleware` for locale routing
- `next.config.ts`: wrapped with `createNextIntlPlugin`
- `messages/bg.json`, `messages/en.json`: full translation files (11 namespaces)
- `src/app/globals.css`: brand tokens + shadcn CSS variables (dark theme)
- `src/app/layout.tsx`: root layout with fonts (Cormorant, Inter, Geist)
- `src/app/[locale]/layout.tsx`: locale layout with Header, Footer, Toaster, NextIntlClientProvider
- `src/components/shared/Header.tsx`: sticky header with i18n nav, locale switcher, mobile hamburger
- `src/components/shared/Footer.tsx`: footer with address, hours, nav, legal links
- `src/components/shared/SloganDivider.tsx`: "Precision · Confidence · Clean Look" triple-beat
- `src/components/marketing/Hero.tsx`: hero section with logo, title, subtitle, CTA
- `src/components/marketing/About.tsx`: about section with paragraph text
- `src/components/marketing/BarbersSection.tsx`: DB-driven barbers grid (nullable bios)
- `src/components/marketing/ServicesSection.tsx`: DB-driven services grid (nullable descriptions)
- `src/components/marketing/GalleryPlaceholder.tsx`: gallery placeholder
- `src/components/marketing/LocationSection.tsx`: location + hours
- `src/app/[locale]/(public)/page.tsx`: homepage server component assembling all sections
- `.env.example`: documented env vars with dev defaults
- `docker-compose.yml`: Postgres 16, Redis 7, Mailpit
