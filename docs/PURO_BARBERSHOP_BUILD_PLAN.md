# Puro Barbershop — Website Build Plan

> **Audience:** This document is written for a coding agent that will implement the website. The human owner (a non-engineer) will supervise. Follow this plan strictly. Do not skip phases. Do not improvise on security. When in doubt, ask the human before deviating.

---

## 0. Read this before you write a single line of code

1. Read this entire document end-to-end before starting.
2. The repository has already been bootstrapped via `create-next-app`. Pick up from Commit 1.
3. Work commit-by-commit in the order listed. **Commits are granular; PRs happen at phase boundaries** (6 PRs total — one per phase). The human supervisor may also choose to review commit-by-commit on `main` and skip PRs entirely.
4. After every commit, run the **Definition of Done** checklist for that commit AND the **Cross-cutting security & quality checklist** in §6. Both must pass before moving on.
5. The phrase `[PLACEHOLDER:description]` marks data the human owner will fill in later. Use that exact format so they can grep for them. Never invent placeholder data that looks real (no fake phone numbers, no fake EIK, no fake people).
6. If you find yourself wanting to add a dependency not listed in §2, stop and justify it in the commit message before adding.
7. If you encounter ambiguity, leave a `TODO(human):` comment and proceed. Do not guess on legal/business logic.
8. After each phase, write a short `docs/PHASE_N_REPORT.md` summarizing what was done, what's blocked, and any deviations.
9. Legal documents (privacy policy, terms of service) are supplied as separate template files (`docs/legal/`). Do not author legal text yourself.

---

## 1. Project context

| Field | Value |
| --- | --- |
| Client | Puro Barbershop |
| Location | Plovdiv, Bulgaria |
| Address | Бул. Христо Ботев 114, Plovdiv, Bulgaria |
| Map pin | `[PLACEHOLDER:google_maps_embed_url]` |
| Phone | `[PLACEHOLDER:shop_phone]` |
| Email | `[PLACEHOLDER:shop_email]` |
| Legal name | `[PLACEHOLDER:legal_entity_name]` |
| EIK / VAT | `[PLACEHOLDER:eik]` / `[PLACEHOLDER:vat_id]` |
| Registered address | `[PLACEHOLDER:registered_address]` |
| Domain | `purobarbershop.com` (to be purchased via Cloudflare Registrar) |
| Slogan (EN) | Precision · Confidence · Clean Look |
| Slogan (BG) | Прецизност · Увереност · Стил |
| Default locale | `bg` |
| Supported locales | `bg`, `en` |
| Timezone | `Europe/Sofia` |
| Currency | BGN (лв) |

> **Slogan note:** The Bulgarian slogan above is a translation attempt by the planner. The human owner will revise if it doesn't land right. Do not change it without their go-ahead.

---

## 2. Locked tech stack

Use exactly these. Do not substitute without approval.

### Runtime & framework
- **Next.js 15+** (App Router, TypeScript, React Server Components by default)
- **React 19**
- **TypeScript** (strict mode, no implicit any, no unchecked indexed access)
- **Node 20 LTS** (Vercel default)

### Database & ORM
- **Neon** (Postgres, Free tier, region: `eu-central-1` for GDPR data residency)
- **Drizzle ORM** + **drizzle-kit** for migrations
- **@neondatabase/serverless** driver

### Auth
- **Auth.js v5** (NextAuth) with Credentials provider only
- **bcryptjs** for password hashing (Edge-compatible)

### UI
- **Tailwind CSS v4**
- **shadcn/ui** (canary/latest, copy components into repo)
- **lucide-react** for icons
- **next/font** for self-hosted Google Fonts
- **sonner** for toasts
- **react-hook-form** + **@hookform/resolvers/zod** for forms

### i18n
- **next-intl** (v3+) with App Router integration

### Validation & env
- **zod** for all runtime validation
- **@t3-oss/env-nextjs** for type-safe env variables

### Email
- **Resend** for sending (free tier: 100/day, 3000/month)
- **react-email** for templates

### Rate limiting
- **@upstash/ratelimit** + **@upstash/redis** (free tier)

### Dates
- **date-fns** + **date-fns-tz** (timezone-aware)

### Analytics
- **None.** Explicitly excluded from this build. If added later (post-launch), it must be cookieless and EU-hosted (e.g., Plausible). Do NOT add Google Analytics.

### Local dev infrastructure
- **Docker Compose** with Postgres 16, Redis 7, Mailpit (SMTP catcher)

### Dev tooling
- **eslint** + **eslint-config-next** + **eslint-plugin-security**
- **prettier** + **prettier-plugin-tailwindcss**
- **husky** + **lint-staged** for pre-commit hooks
- **typescript-eslint** strict rules

### Testing (minimum viable)
- **vitest** for unit tests
- **@playwright/test** for one critical-path E2E (the booking flow)

---

## 3. Repository structure

```
puro-barbershop/
├── .github/
│   └── workflows/
│       ├── ci.yml              # Lint, typecheck, test on PR
│       └── deploy-preview.yml  # Vercel preview deploys
├── .husky/
│   └── pre-commit              # lint-staged
├── drizzle/
│   ├── migrations/             # Generated SQL
│   └── seed.ts                 # Dev seed data
├── messages/
│   ├── bg.json                 # Bulgarian copy
│   └── en.json                 # English copy
├── public/
│   ├── logo.png                # Provided
│   ├── og-image.jpg            # Open Graph image
│   └── favicon/                # Multiple sizes
├── src/
│   ├── app/
│   │   ├── [locale]/
│   │   │   ├── (public)/
│   │   │   │   ├── page.tsx                # Homepage
│   │   │   │   ├── book/
│   │   │   │   │   ├── page.tsx            # Booking flow
│   │   │   │   │   ├── confirmation/page.tsx
│   │   │   │   │   └── cancel/[token]/page.tsx
│   │   │   │   └── legal/
│   │   │   │       ├── privacy/page.tsx
│   │   │   │       ├── terms/page.tsx
│   │   │   │       └── cookies/page.tsx
│   │   │   ├── (admin)/
│   │   │   │   ├── admin/
│   │   │   │   │   ├── layout.tsx          # Protected layout
│   │   │   │   │   ├── page.tsx            # Dashboard
│   │   │   │   │   ├── schedule/page.tsx   # Calendar view
│   │   │   │   │   ├── barbers/            # Super admin only
│   │   │   │   │   ├── services/           # Super admin only
│   │   │   │   │   ├── settings/           # Super admin only
│   │   │   │   │   ├── time-off/page.tsx
│   │   │   │   │   └── login/page.tsx
│   │   │   └── layout.tsx                  # Locale layout
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   └── cron/
│   │   │       └── reminders/route.ts      # 24h reminder cron
│   │   ├── layout.tsx                      # Root layout
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                             # shadcn primitives
│   │   ├── booking/                        # Booking flow components
│   │   ├── admin/                          # Admin components
│   │   ├── marketing/                      # Homepage sections
│   │   └── shared/                         # Header, footer, etc.
│   ├── db/
│   │   ├── index.ts                        # Drizzle client
│   │   └── schema.ts                       # All tables
│   ├── lib/
│   │   ├── auth.ts                         # Auth.js config
│   │   ├── env.ts                          # Type-safe env
│   │   ├── rate-limit.ts
│   │   ├── email/
│   │   │   ├── client.ts                   # Resend client
│   │   │   └── templates/                  # react-email components
│   │   ├── booking/
│   │   │   ├── availability.ts             # Slot generation logic
│   │   │   └── tokens.ts                   # Signed cancellation tokens
│   │   ├── i18n/
│   │   │   ├── config.ts
│   │   │   ├── request.ts
│   │   │   └── routing.ts
│   │   └── utils.ts
│   ├── actions/                            # Server Actions
│   │   ├── booking.ts
│   │   ├── admin/
│   │   │   ├── barbers.ts
│   │   │   ├── services.ts
│   │   │   ├── settings.ts
│   │   │   └── time-off.ts
│   ├── middleware.ts                       # Locale + auth gating
│   └── types/
├── tests/
│   ├── unit/
│   └── e2e/
├── .env.example
├── .gitignore
├── .nvmrc                                  # 20
├── drizzle.config.ts
├── eslint.config.mjs
├── next.config.ts
├── package.json
├── playwright.config.ts
├── README.md
├── SECURITY.md
├── tailwind.config.ts                      # v4 may not need this
├── tsconfig.json
└── vitest.config.ts
```

---

## 4. Environment variables

Every variable below goes in `.env.example` (committed) and `.env.local` (gitignored). All must be defined in `src/lib/env.ts` with Zod validation.

```bash
# Database
DATABASE_URL=                          # Neon pooled connection string
DATABASE_URL_UNPOOLED=                 # For migrations only

# Auth.js
AUTH_SECRET=                           # openssl rand -base64 32
AUTH_URL=                              # https://purobarbershop.com (prod), http://localhost:3000 (dev)

# Email
RESEND_API_KEY=
EMAIL_FROM="Puro Barbershop <no-reply@purobarbershop.com>"
EMAIL_REPLY_TO=                        # Shop's real email for replies

# Rate limiting
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Cron (Vercel Cron Jobs)
CRON_SECRET=                           # Random secret to verify cron requests

# Email transport selection (dev vs prod)
EMAIL_TRANSPORT=resend                 # 'resend' in prod, 'smtp' in dev (Mailpit)
SMTP_HOST=localhost                    # dev only — Mailpit
SMTP_PORT=1025                         # dev only — Mailpit

# Instagram (LightWidget — just an embed ID, public)
NEXT_PUBLIC_LIGHTWIDGET_ID=            # [PLACEHOLDER:lightwidget_id]

# Shop info (public, for SEO/structured data)
NEXT_PUBLIC_SHOP_NAME=Puro Barbershop
NEXT_PUBLIC_SHOP_ADDRESS="Бул. Христо Ботев 114, Plovdiv, Bulgaria"
NEXT_PUBLIC_SHOP_PHONE=                # [PLACEHOLDER]
NEXT_PUBLIC_SHOP_EMAIL=                # [PLACEHOLDER]
NEXT_PUBLIC_SHOP_LAT=42.1354           # Approximate Plovdiv center; refine when pin is provided
NEXT_PUBLIC_SHOP_LNG=24.7453
```

**Security rule:** Anything not prefixed `NEXT_PUBLIC_` is server-only. If you find a server secret being imported into a client component, it's a bug — fail the build.

---

## 5. Brand & design system

### Brand foundation
- Logo: vintage script "PURO" with "BARBERSHOP" beneath. White on black. Use as-is.
- Aesthetic: dark, editorial, classic, masculine. Think Barber & Co Miami, Wayward Barbershop.
- Slogan rhythm: "Precision · Confidence · Clean Look" as a three-beat divider element used multiple times across the site.

### Color tokens
Add to `globals.css` as CSS variables, referenced from Tailwind theme.

```css
:root {
  --background: #0a0a0a;        /* Near-black, not pure black */
  --foreground: #f5f1ea;        /* Warm off-white */
  --muted: #1a1a1a;
  --muted-foreground: #a8a29e;
  --accent: #c9a961;            /* Muted champagne/gold */
  --accent-foreground: #0a0a0a;
  --border: #262626;
  --input: #1a1a1a;
  --ring: #c9a961;
  --destructive: #ef4444;
  --success: #10b981;
}
```

### Typography
- **Headings:** Cormorant Garamond (serif, weights 400/500/600) — pairs with the script logo
- **Body:** Inter (sans-serif, weights 400/500/600)
- **Slogan/accent:** Cormorant Garamond italic
- Use `next/font/google` to self-host (avoids third-party requests, GDPR-friendlier)

### Layout principles
- Mobile-first. Test every screen at 375px width.
- Generous vertical spacing. Don't cram.
- Use the slogan triple-beat as visual divider between major sections.
- Hero is full viewport height on desktop, ~80vh on mobile.
- Sticky header that goes solid on scroll.
- Primary CTA ("Book Now" / "Запази час") visible at all times on mobile.

> The agent should also consult `/mnt/skills/public/frontend-design/SKILL.md` before doing any UI work for environment-specific styling guidance.

---

## 6. Cross-cutting security & quality checklist

**Apply to every commit. PR cannot merge until all items pass.**

### Secrets & config
- [ ] No secrets, tokens, or credentials in code or git history
- [ ] `.env.local` is gitignored; `.env.example` has all keys with empty/placeholder values
- [ ] All env vars validated through `src/lib/env.ts` with Zod
- [ ] Server-only env vars are not prefixed `NEXT_PUBLIC_`

### Input handling
- [ ] All Server Action inputs validated with Zod at the function boundary
- [ ] All API route inputs validated with Zod at the function boundary
- [ ] All URL parameters validated before use
- [ ] No raw SQL with string concatenation — Drizzle parameterized queries only
- [ ] No `dangerouslySetInnerHTML` without sanitization (we shouldn't need it at all)

### Authentication & authorization
- [ ] Every admin route protected by middleware
- [ ] Every admin Server Action re-checks authentication and authorization (defense in depth)
- [ ] Role checks use the helper in `src/lib/auth.ts`, never inline strings
- [ ] No authorization logic on the client — always server-side

### Database
- [ ] Migrations are forward-only and reviewed
- [ ] All foreign keys defined
- [ ] UNIQUE constraints prevent duplicate bookings at the DB level
- [ ] No `SELECT *` in user-facing queries; select only what's needed
- [ ] No N+1 queries in lists

### Rate limiting & abuse
- [ ] Public mutation endpoints rate-limited per IP
- [ ] Booking endpoint also rate-limited per email and per phone
- [ ] Auth endpoints rate-limited per IP

### Output & XSS
- [ ] No user-supplied HTML rendered without escaping
- [ ] Email templates do not interpolate raw user input into HTML attributes
- [ ] All external links in user content use `rel="noopener noreferrer"`

### Headers & transport
- [ ] HTTPS only (Vercel default + HSTS)
- [ ] CSP configured (see commit 21)
- [ ] X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Referrer-Policy: strict-origin-when-cross-origin

### Privacy & data
- [ ] Only collect: name, email, phone, optional notes — nothing else
- [ ] No PII in logs (mask emails to `j***@example.com` in any log output)
- [ ] No PII in analytics events
- [ ] Cancellation tokens are signed (HMAC) and time-limited
- [ ] Booking records purged after 12 months (cron job, phase 6)

### Errors
- [ ] Errors logged server-side with enough context to debug
- [ ] User-facing errors are generic ("Something went wrong, please try again")
- [ ] Never expose stack traces, DB errors, or internal paths to users

### Code quality
- [ ] `npm run lint` passes
- [ ] `npm run typecheck` passes (no `any`, no `// @ts-ignore` without explanation)
- [ ] `npm run test` passes
- [ ] `npm audit` shows no high/critical vulnerabilities
- [ ] All new code has at least basic unit tests where logic is non-trivial

### Accessibility (verify per UI commit)
- [ ] Color contrast WCAG AA (4.5:1 for text)
- [ ] All interactive elements keyboard-accessible
- [ ] Form fields have associated labels
- [ ] Images have alt text
- [ ] Focus indicators visible on dark background

---

## 7. Database schema (Drizzle)

Final shape. Build in commit 3.

```typescript
// src/db/schema.ts
import { pgTable, serial, text, timestamp, integer, boolean, uniqueIndex, pgEnum, varchar, decimal, time, smallint } from 'drizzle-orm/pg-core';

export const userRole = pgEnum('user_role', ['super_admin', 'barber']);
export const bookingStatus = pgEnum('booking_status', ['confirmed', 'cancelled', 'completed', 'no_show']);

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: userRole('role').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const barbers = pgTable('barbers', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  nameEn: varchar('name_en', { length: 100 }).notNull(),
  nameBg: varchar('name_bg', { length: 100 }).notNull(),
  bioEn: text('bio_en'),
  bioBg: text('bio_bg'),
  photoUrl: text('photo_url'),
  displayOrder: integer('display_order').default(0).notNull(),
  active: boolean('active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const services = pgTable('services', {
  id: serial('id').primaryKey(),
  nameEn: varchar('name_en', { length: 100 }).notNull(),
  nameBg: varchar('name_bg', { length: 100 }).notNull(),
  descriptionEn: text('description_en'),
  descriptionBg: text('description_bg'),
  durationMinutes: integer('duration_minutes').notNull(),
  priceBgn: decimal('price_bgn', { precision: 10, scale: 2 }).notNull(),
  displayOrder: integer('display_order').default(0).notNull(),
  active: boolean('active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const workingHours = pgTable('working_hours', {
  id: serial('id').primaryKey(),
  barberId: integer('barber_id').references(() => barbers.id, { onDelete: 'cascade' }).notNull(),
  dayOfWeek: smallint('day_of_week').notNull(), // 0=Sunday, 6=Saturday
  startTime: time('start_time').notNull(),
  endTime: time('end_time').notNull(),
  active: boolean('active').default(true).notNull(),
});

export const timeOff = pgTable('time_off', {
  id: serial('id').primaryKey(),
  barberId: integer('barber_id').references(() => barbers.id, { onDelete: 'cascade' }).notNull(),
  startDatetime: timestamp('start_datetime', { withTimezone: true }).notNull(),
  endDatetime: timestamp('end_datetime', { withTimezone: true }).notNull(),
  reason: text('reason'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const bookings = pgTable('bookings', {
  id: serial('id').primaryKey(),
  serviceId: integer('service_id').references(() => services.id).notNull(),
  barberId: integer('barber_id').references(() => barbers.id).notNull(),
  customerName: varchar('customer_name', { length: 100 }).notNull(),
  customerEmail: varchar('customer_email', { length: 255 }).notNull(),
  customerPhone: varchar('customer_phone', { length: 30 }).notNull(),
  startDatetime: timestamp('start_datetime', { withTimezone: true }).notNull(),
  endDatetime: timestamp('end_datetime', { withTimezone: true }).notNull(),
  status: bookingStatus('status').default('confirmed').notNull(),
  cancellationToken: varchar('cancellation_token', { length: 64 }).notNull().unique(),
  locale: varchar('locale', { length: 5 }).default('bg').notNull(),
  notes: text('notes'),
  reminderSent: boolean('reminder_sent').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  // CRITICAL: Prevent double-booking at the DB level.
  // The partial unique index ensures only confirmed bookings count.
  barberSlotUnique: uniqueIndex('barber_slot_unique').on(table.barberId, table.startDatetime).where(sql`status = 'confirmed'`),
}));

export const settings = pgTable('settings', {
  key: varchar('key', { length: 100 }).primaryKey(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const emailBlacklist = pgTable('email_blacklist', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  reason: text('reason'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

### Default settings seeded
- `buffer_minutes` = `15`
- `cancellation_window_hours` = `24`
- `booking_horizon_days` = `60` (how far ahead someone can book)
- `slot_granularity_minutes` = `15` (slots start every 15 min)

---

## 8. Build phases — commits

Each commit has: **Goal**, **Tasks**, **Files**, **Dependencies to add**, **Definition of done**, and **Security notes**.

---

### PHASE 1 — Foundation

#### Commit 1: Tooling, lint, formatting, docker-compose
**Goal:** Production-grade tooling on top of the existing `create-next-app` bootstrap.

**Pre-condition:** Repository already exists with Next.js 15 + TypeScript + Tailwind v4 + App Router + src dir from `create-next-app`. `.nvmrc` already pinned to 20.

**Tasks:**
- Set TypeScript to strict in `tsconfig.json`: `strict: true`, `noUncheckedIndexedAccess: true`, `noImplicitOverride: true`, `exactOptionalPropertyTypes: true`, `noFallthroughCasesInSwitch: true`
- Install and configure ESLint with `eslint-config-next`, `eslint-plugin-security`, `@typescript-eslint/eslint-plugin`, `eslint-config-prettier`. Use `eslint.config.mjs` flat config.
- Install and configure Prettier with `prettier-plugin-tailwindcss`
- Add husky + lint-staged for pre-commit (lint + typecheck only on staged files)
- Add `.editorconfig`
- Add `README.md` with setup instructions including docker-compose usage
- Add `docs/SECURITY.md` referencing §6 of this plan
- Add `docs/legal/` directory and copy in the `PRIVACY_POLICY_TEMPLATE.md` and `TERMS_OF_SERVICE_TEMPLATE.md` files provided alongside this plan
- Configure `package.json` scripts: `dev`, `build`, `start`, `lint`, `lint:fix`, `typecheck`, `format`, `format:check`, `db:*` (placeholders), `test`, `test:e2e`, `docker:up`, `docker:down`
- Add `docker-compose.yml` (provided as a sibling file to this plan — copy verbatim into the repo root)
- Add `.dockerignore`
- Verify the docker stack starts: `docker compose up -d` then verify Postgres, Redis, and Mailpit reachable

**Definition of done:**
- `npm run dev` opens a working homepage at localhost:3000
- `npm run lint`, `npm run typecheck`, `npm run format:check` all pass
- Pre-commit hook runs on a test commit (intentionally introduce a lint error, attempt commit, verify rejection)
- `docker compose up -d` brings up Postgres (5432), Redis (6379), Mailpit web UI (http://localhost:8025)
- All three containers report healthy

**Security notes:** Confirm `.env.local` is in `.gitignore` from the start. Do not commit any seed passwords or local credentials. The docker-compose passwords are for local development only and must not be reused in any deployed environment.

---

#### Commit 2: Type-safe env + folder scaffolding
**Goal:** Lock down env handling and lay out all directories.

**Tasks:**
- Install `@t3-oss/env-nextjs zod`
- Create `src/lib/env.ts` with Zod schemas for all server and client env vars (see §4)
- Create `.env.example` with every var listed and empty/placeholder values
- Create empty index files for the folder structure in §3 so the agent can fill them later
- Add a runtime check that throws if `env.ts` validation fails (default behavior of t3-env)
- Create `src/lib/utils.ts` with `cn` helper

**Definition of done:**
- Importing `env` from `@/lib/env` provides typed, validated env access
- Removing a required env var causes `npm run build` to fail with a clear error

**Security notes:** Never log `env` — that's a credential exposure vector. Add this as an ESLint custom rule note in `eslint.config.mjs` comments.

---

#### Commit 3: Database schema, migrations, seed
**Goal:** Drizzle wired up with the schema from §7, working against local Postgres (docker) in dev and Neon in prod.

**Tasks:**
- For prod: human owner signs up for Neon, creates EU project (region `eu-central-1`), provides pooled and unpooled connection strings (stored in Vercel env, not local)
- For dev: connection strings auto-derive from docker-compose (see `.env.example` defaults)
- Install `drizzle-orm @neondatabase/serverless`, `drizzle-kit` (dev), `postgres` (for local dev driver)
- Implement an env-driven DB client: in dev use `postgres` (works against local Postgres in docker), in prod use Neon serverless driver
- Configure `drizzle.config.ts` pointing to schema and migrations folders
- Implement `src/db/schema.ts` exactly as §7
- Implement `src/db/index.ts` exporting a Drizzle client
- Generate initial migration: `npm run db:generate`
- Run migration: `npm run db:migrate`
- Add `drizzle/seed.ts` that inserts:
  - 1 super admin user (email: `admin@purobarbershop.com`, password: from env var `SEED_ADMIN_PASSWORD`, hashed with bcrypt). The seed must abort if the env var is missing or weaker than 16 chars.
  - 2 placeholder barbers (`[PLACEHOLDER:barber_1_name]`, `[PLACEHOLDER:barber_2_name]`)
  - 4 placeholder services: Haircut, Haircut + Beard, Beard trim, Kids haircut — all with placeholder durations (30/45/20/30 min) and prices (`[PLACEHOLDER:price]`)
  - Working hours: Mon–Fri 09:00–19:00, Sat 09:00–17:00, closed Sun for each barber (editable later)
  - Default settings: buffer=15, cancellation_window=24, horizon=60
- Add scripts: `db:generate`, `db:migrate`, `db:push`, `db:studio`, `db:seed`, `db:reset` (drops and recreates dev DB only — refuses to run if DATABASE_URL points to Neon)

**Definition of done:**
- `npm run db:studio` shows all tables with seeded data
- `npm run db:reset` works locally and refuses to run against a Neon URL (safety check on URL pattern)
- Connection string is the pooled URL for runtime, unpooled for migrations

**Security notes:**
- Seed password must come from env, never hardcoded
- Production database URL must be different from dev (separate Neon branch)
- The super admin password must be changed by the human owner on first login (flag this in the README and add a TODO in the seed file)
- `db:reset` script must inspect the connection string and refuse if it contains `neon.tech` or any prod hostname — accidental wipes of prod are catastrophic

---

#### Commit 4: Design tokens, fonts, base layout, header & footer
**Goal:** The brand visual system is in place — any new page automatically looks "Puro".

**Tasks:**
- Add color tokens from §5 to `globals.css`
- Configure Tailwind v4 theme to consume CSS variables
- Add Cormorant Garamond and Inter via `next/font/google` with `display: 'swap'`
- Create `src/components/shared/Header.tsx` — logo left, nav center (Services, Gallery, Location, Book), language switcher right. Mobile: hamburger menu.
- Create `src/components/shared/Footer.tsx` — slogan, address, hours, social, legal links, copyright with current year
- Create `src/components/shared/SloganDivider.tsx` — the "Precision · Confidence · Clean Look" triple-beat element with elegant separators
- Update `src/app/[locale]/layout.tsx` to use header + footer
- Add the logo to `/public/logo.png`
- Run shadcn init: `npx shadcn@latest init` — pick "Default" style, "Slate" base color, then override with our tokens
- Pre-install components we'll need: button, input, label, select, calendar, dialog, sheet, dropdown-menu, form, popover, toast (sonner), card, tabs, alert, separator

**Definition of done:**
- Visiting `/` shows a styled (but mostly empty) page with header, footer, and divider
- Mobile menu works at 375px width
- Lighthouse accessibility ≥ 95 on this empty page

**Security notes:** Self-hosted fonts only. Don't load Google Fonts via `<link>` — that's a third-party request that triggers GDPR concerns.

---

### PHASE 2 — Public site

#### Commit 5: Localization foundation (next-intl)
**Goal:** Full BG/EN routing with `/bg/...` and `/en/...` URLs, default BG.

**Tasks:**
- Install `next-intl`
- Configure `src/i18n/routing.ts` with locales `['bg', 'en']`, default `'bg'`, `localePrefix: 'always'`
- Implement `src/i18n/request.ts` to load the correct messages bundle
- Implement `src/middleware.ts` combining next-intl routing with future auth checks (auth comes in commit 13; for now just locale routing)
- Create `messages/bg.json` and `messages/en.json` with namespaces: `common`, `nav`, `home`, `services`, `booking`, `gallery`, `location`, `footer`, `legal`, `admin`, `email`
- Wire up `useTranslations` in header, footer, and homepage
- Add a `LocaleSwitcher` component (preserves current path)
- Update Header to show "BG | EN" toggle

**Definition of done:**
- `/` redirects to `/bg`
- `/en` shows English copy
- Switching language preserves the current page
- All visible strings come from translation files, no hardcoded copy

**Security notes:** Validate locale parameter in middleware (only allow defined locales) — reject anything else with a 404. Don't render content from untrusted locale strings.

---

#### Commit 6: Homepage sections (static)
**Goal:** All non-dynamic homepage sections built and copy localized.

**Tasks:**
- **Hero:** Full-bleed background (use a placeholder dark image, `[PLACEHOLDER:hero_image]`), logo, slogan, primary CTA "Запази час" / "Book Now" linking to `/bg/book` or `/en/book`
- **About:** Short paragraph about the shop, image placeholder. Use `[PLACEHOLDER:about_copy_bg]` and `[PLACEHOLDER:about_copy_en]` in the translation files with descriptive placeholder values
- **Barbers:** Pull from DB. Show name, bio, photo. If photoUrl is null, show a styled initials avatar.
- **Services:** Pull from DB. Show name, description, duration, price. "Book this service" CTA per service that pre-selects in booking flow.
- **Gallery:** Placeholder section (commit 7 fills it)
- **Location:** Address, working hours table from DB, and a "Get directions" button that opens the user's native maps app (iOS Maps / Google Maps via universal link `https://www.google.com/maps/dir/?api=1&destination=<encoded address>`). No embedded iframe — keeps the page lightweight and avoids the GDPR concerns of a third-party map iframe.
- **CTA strip:** Slogan divider + big "Book Now" before footer

**Definition of done:**
- Homepage renders all sections in both locales
- All copy comes from translation files
- DB-driven sections (barbers, services) render correctly
- "Get directions" button opens native maps on mobile and Google Maps on desktop
- Mobile layout works at 375px

**Security notes:**
- Get directions link uses URL encoding on the address; verify no XSS vector
- No third-party iframes loaded on the homepage by default

---

#### Commit 7: Instagram gallery (click-to-load)
**Goal:** Gallery section pulls from Instagram via LightWidget. Loaded only on explicit user action — no third-party content fires until the user clicks.

**Why click-to-load:** LightWidget's iframe loads Instagram content, which sets third-party cookies. Under GDPR/ePrivacy, that's a consent surface. Instead of a global cookie banner, we use the well-established "click-to-load" pattern (same as YouTube embeds on privacy-friendly sites). The user clicking "Show Instagram feed" is unambiguous, specific consent for that single element.

**Approach:** **LightWidget** free tier for MVP. Embeddable widget that the barbers configure once; new IG posts appear automatically. Zero server-side IG API complexity.

**Tasks:**
- Human owner creates a LightWidget account, points it at the Puro IG, gets the widget ID, adds it to `.env.local` as `NEXT_PUBLIC_LIGHTWIDGET_ID`
- Create `src/components/marketing/InstagramGallery.tsx`:
  - Default state: placeholder showing a styled card with the IG logo, copy ("Виж нашата работа в Instagram" / "See our work on Instagram"), brief notice that loading the feed connects to Instagram and may set cookies, and a "Show feed" / "Покажи лентата" button
  - On click: state flips to loaded; iframe with the LightWidget embed is mounted
  - Once loaded, persists for the session only (no cookie, no localStorage)
  - Wrapped in error boundary; if iframe fails, shows a fallback link to Instagram
- Add a heading and a "See more on Instagram" link beside the placeholder
- Set `revalidate` on the homepage to 1 hour so the page shell is cached

**Definition of done:**
- Gallery section shows the placeholder by default — no third-party requests are made on first page load (verify via DevTools Network tab)
- Clicking the load button mounts the iframe and IG content appears
- If widget ID is missing or load fails, fallback link shows instead of a broken iframe

**Upgrade path (phase 2, document but don't build):** Build a custom integration with Instagram Graph API. Cache responses for 6 hours via `unstable_cache`. Requires IG Business account, FB App, and long-lived token rotation. With this, the feed could be rendered server-side from cached data with no third-party requests at runtime, eliminating the consent question entirely.

**Security notes:**
- The placeholder must visually communicate that loading the feed involves a third party — this is the "informed" part of informed consent
- LightWidget iframe (when loaded) should have `sandbox="allow-scripts allow-same-origin allow-popups"` and a strict referrer policy
- Add the LightWidget domain to CSP `frame-src` (commit 21)
- Do NOT mount the iframe at all on the initial render — even hidden, it would fire third-party requests

---

#### Commit 8: Legal pages (Privacy, Terms, Cookie info)
**Goal:** Static legal pages rendering the template content with placeholders for legal entity info.

**Tasks:**
- The legal text is supplied in `docs/legal/PRIVACY_POLICY_TEMPLATE.md` and `docs/legal/TERMS_OF_SERVICE_TEMPLATE.md`. Do not rewrite this content. Render it.
- Create `src/app/[locale]/(public)/legal/privacy/page.tsx`, `terms/page.tsx`, `cookie-info/page.tsx`
  - `cookie-info` is short — explains the small set of strictly-necessary cookies the site uses (auth session, locale preference, consent state on the IG load decision is session-only). No consent banner; this page just informs.
- Use MDX or plain JSX to render the templates. Sections must be navigable (jump links).
- Both BG and EN versions per page. Source markdown files have a YAML frontmatter `lang: bg | en` to pick the right one.
- Footer links: Privacy, Terms, Cookie info (in current locale)

**Definition of done:**
- All three pages render in both locales
- Footer links work
- Page has table of contents / clear sections
- Print-friendly (basic CSS)
- A diff against `PRIVACY_POLICY_TEMPLATE.md` shows the page faithfully renders the template (no agent-introduced edits)

**Security notes:** These are legal documents. The agent MUST NOT modify the substance of the templates. Format and present only. Any deviation must be flagged with a `TODO(human):` comment for legal review.

---

### PHASE 3 — Booking system

#### Commit 9: Booking availability engine
**Goal:** A pure, well-tested module that given a service, barber, and date range returns available time slots.

**Tasks:**
- Create `src/lib/booking/availability.ts` with these pure functions:
  - `getAvailableSlots({ serviceId, barberId, date, db })` → returns array of `Date` objects (in Europe/Sofia)
  - `getAvailableSlotsForAnyBarber({ serviceId, date, db })` → returns `Array<{ slot: Date; availableBarberIds: number[] }>`
- Logic:
  1. Load service duration + global buffer minutes
  2. Load barber's working hours for that day of week
  3. Subtract time_off periods overlapping that day
  4. Subtract existing confirmed bookings (including buffer)
  5. Generate candidate slots at `slot_granularity_minutes` intervals
  6. Filter slots where `slot + duration + buffer ≤ end of working window` AND no overlap
  7. Filter out slots in the past
  8. Filter out slots beyond `booking_horizon_days`
- All times handled in UTC internally, formatted in Europe/Sofia for display
- Write unit tests in `tests/unit/availability.test.ts` covering:
  - Empty schedule
  - Schedule with existing bookings
  - Schedule with time off
  - Buffer enforcement
  - DST transitions (last Sunday of March, last Sunday of October)
  - Edge: booking exactly at end of working day

**Definition of done:**
- All unit tests pass
- Function returns correct slots for hand-verified test cases
- No DB writes from this module (pure read)

**Security notes:**
- Treat any input date that's beyond `booking_horizon_days` or in the past as invalid — return empty array, don't throw
- Validate IDs as positive integers before querying

---

#### Commit 10: Booking UI (multi-step form)
**Goal:** A polished, mobile-first 4-step booking flow.

**Tasks:**
- Create `/[locale]/book/page.tsx` with a stepper component
- Steps:
  1. **Service** — grid of service cards (name, duration, price). Click to select.
  2. **Barber** — list of barbers with photo + name + bio snippet. "Any available" option always at top.
  3. **Date & time** — calendar (shadcn) with available dates highlighted. Tap a date → grid of available time slots (from availability engine via Server Action). Slots load with skeleton.
  4. **Your details** — form: name, email, phone, optional notes, mandatory consent checkbox (linking to Privacy Policy and Terms). All required fields marked.
- After step 4, on submit: show loading state, then redirect to confirmation page.
- Persist step state in URL search params so back button works.
- Pre-select service if user lands on `/book?service=<id>`.
- Use react-hook-form + Zod resolver throughout.
- All copy localized.
- Phone input: accept international format, validate with libphonenumber-js (lightweight, max version).

**Definition of done:**
- Full flow works end-to-end on mobile (375px) and desktop
- Back button works between steps
- Validation errors show inline and are accessible
- Loading and error states styled

**Security notes:**
- Slot fetching uses a Server Action — don't expose raw barber schedules via a public API
- Don't reveal in error messages which specific field violated rate limit (just "too many requests")

---

#### Commit 11: Booking server action + double-booking prevention
**Goal:** Atomic, rate-limited, validated booking creation that cannot double-book under any race condition.

**Tasks:**
- Create `src/actions/booking.ts` with `createBooking(input)`:
  1. Validate input with Zod (service, barber or "any", date, time, name, email, phone, consent=true, locale)
  2. Sanitize: trim whitespace, normalize email (lowercase), parse phone
  3. Check email_blacklist — if present, return generic error (don't reveal blacklisting)
  4. Rate limit checks (Upstash):
     - 5 attempts per IP per 10 minutes
     - 3 bookings per email per 24 hours
     - 3 bookings per phone per 24 hours
  5. If barberId is "any", call the availability engine and pick the first available barber for that slot
  6. Server-side re-check that the slot is still available (don't trust the client's view)
  7. Generate cancellation token: HMAC of `(bookingId + secret)` truncated to 32 chars, stored on the booking
  8. Insert booking inside a transaction with `INSERT ... ON CONFLICT DO NOTHING` on the unique index
     - If conflict (someone got the slot first), return "Slot just taken, please pick another"
  9. Trigger confirmation email + barber notification email asynchronously (don't block the response)
  10. Return success with bookingId (NOT the cancellation token — that goes only in the email)
- Create `src/lib/rate-limit.ts` with a `RateLimiter` interface, two implementations: `UpstashRateLimiter` (prod, uses `@upstash/ratelimit` + `@upstash/redis`) and `LocalRateLimiter` (dev, uses ioredis pointed at the docker Redis, or a stub no-op if `RATE_LIMIT_DEV=off`). Factory chooses based on env. Three named limiters (`ip`, `email`, `phone`).
- Create `src/lib/booking/tokens.ts` with `generateCancellationToken(bookingId)` and `verifyCancellationToken(token, bookingId)` using HMAC-SHA256 with `AUTH_SECRET`

**Definition of done:**
- Booking flow creates a row in `bookings`
- Trying to book the same slot twice concurrently results in one success, one "slot taken"
- Rate limits trigger after the configured threshold
- Manual SQL `SELECT *` shows correctly formatted data

**Security notes:**
- The unique index in §7 IS the last line of defense — verify it exists in production DB
- Cancellation token must NEVER be returned to the client in API responses, only sent via email
- IP-based rate limiting must use the real client IP from Vercel headers (`x-forwarded-for` first value), not the connection IP
- Log rate limit hits with the masked email for monitoring

---

#### Commit 12: Emails + cancellation flow
**Goal:** Confirmation, barber notification, and cancellation flow with signed tokens. Dev environment routes mail to Mailpit; prod uses Resend.

**Tasks:**
- Install `resend`, `react-email`, `nodemailer`, `@types/nodemailer`
- Create `src/lib/email/client.ts` with an `EmailClient` interface (`send({ to, from, subject, react })`)
- Implement `ResendEmailClient` (prod)
- Implement `SmtpEmailClient` using nodemailer (dev — points at Mailpit on `localhost:1025`)
- Factory selects implementation from `EMAIL_TRANSPORT` env var; throws at boot if `production` build with non-Resend transport
- Create react-email templates in `src/lib/email/templates/`:
  - `CustomerConfirmation.tsx` — booking details, cancellation link, shop address & phone, BG/EN aware
  - `BarberNotification.tsx` — new booking alert for the assigned barber
  - `CustomerCancellation.tsx` — confirmation of cancellation
  - `CustomerReminder.tsx` — 24h reminder (used by cron in commit 20)
- All templates: brand colors, logo, dark-on-light for inbox readability (most email clients struggle with dark mode emails)
- Confirmation email contains a cancellation link: `https://purobarbershop.com/[locale]/book/cancel/[token]`
- Create `/[locale]/book/cancel/[token]/page.tsx`:
  - Server-side: verify token, load booking, check it's still cancellable (>= 24h before start), show confirm UI
  - On confirm: Server Action updates booking to 'cancelled', sends cancellation email, shows confirmation message
- Create confirmation page `/[locale]/book/confirmation/page.tsx` that accepts a signed bookingId via search param and shows the details (re-fetches from DB)

**Definition of done:**
- Booking sends both emails on success
- In dev, emails appear in Mailpit UI at http://localhost:8025 within seconds
- Emails render correctly in Gmail, Outlook, Apple Mail (use react-email preview)
- Cancellation link works
- Cancellation outside the 24h window shows a clear message ("Please call us to cancel")
- A production build with `EMAIL_TRANSPORT=smtp` refuses to start (fail loud, not silent)

**Security notes:**
- Tokens are HMAC, time-bound by checking booking start time
- Cancellation page must NOT reveal whether a token is invalid vs already used vs out of window — generic "Cannot cancel this booking" message, log details server-side
- Mask email and phone in the email previews shown on the confirmation page (`j***@example.com`, `+359 *** *** 23`) in case it's sent to the wrong person who somehow has the link
- Mailpit credentials and ports are dev-only; never expose Mailpit publicly

---

### PHASE 4 — Admin system

#### Commit 13: Auth.js setup + login
**Goal:** Login with email + password, sessions, role-aware middleware.

**Tasks:**
- Install `next-auth@beta` (v5), `bcryptjs`, `@types/bcryptjs`
- Create `src/lib/auth.ts`:
  - Credentials provider that looks up user by email, verifies password with bcrypt
  - JWT strategy (no DB session table needed)
  - Custom callbacks to attach `role` and `barberId` to session
  - Strict session max age: 8 hours
- Create `src/app/api/auth/[...nextauth]/route.ts`
- Update `src/middleware.ts` to:
  - Run locale routing (existing)
  - Block `/[locale]/admin/**` for unauthenticated users → redirect to `/[locale]/admin/login`
  - Block super-admin-only routes from barbers
- Create `/[locale]/admin/login/page.tsx` with login form (email + password)
- Add logout button to admin layout

**Definition of done:**
- Seeded super admin can log in
- Visiting `/admin` without auth redirects to login
- Logout clears session
- Sessions expire after 8h

**Security notes:**
- bcrypt cost factor: 12 minimum
- Generic error message on failed login ("Invalid credentials") — don't reveal whether email exists
- Rate-limit login attempts: 5 per IP per 15 min, 5 per email per 15 min
- AUTH_SECRET rotated separately for prod vs dev
- Login form uses POST + Server Action (CSRF-protected automatically)
- No "remember me" — keep sessions short
- Add a banner on the dashboard if the user is still using the seed password (track via a flag in the users table or a setting)

---

#### Commit 14: Admin layout + dashboard
**Goal:** Authenticated admin shell with navigation and the dashboard landing page.

**Tasks:**
- Create `src/app/[locale]/(admin)/admin/layout.tsx`:
  - Top bar: logo, current user email, role badge, logout
  - Sidebar: Dashboard, Schedule, Time Off. Super admin only: Barbers, Services, Settings.
  - Mobile: collapsible sidebar
- Dashboard page shows:
  - Today's bookings (cards, time/customer/service/barber)
  - This week's stats (count, by status)
  - Upcoming time off
  - Quick links
- All copy localized

**Definition of done:**
- Barber sees their own dashboard view
- Super admin sees all bookings
- Sidebar items hidden if user lacks permission

**Security notes:**
- Server components fetch data with the user's session — barbers see all bookings (per requirements) but page-level role checks block barber from clicking into super-admin pages
- Defense in depth: every action also re-checks role; don't rely on UI hiding

---

#### Commit 15: Schedule view (calendar)
**Goal:** A calendar showing all barbers' bookings, with editing rights per role.

**Tasks:**
- Build a custom week/day calendar (don't pull in heavy libraries — `react-big-calendar` is overkill). Use a CSS grid.
- Toggle: Day view, Week view
- Color-coded by barber
- Filter: show all barbers / specific barber
- Click a booking → modal with details, "Cancel" button (sends cancellation email), "Mark no-show" button (only after start time)
- Authorization: barbers can only edit their own bookings; super admin can edit any
- "Add walk-in" button (super admin + the relevant barber): manually create a booking without email collection
- Time off shown as striped overlay
- "Add time off" button per barber row

**Definition of done:**
- Calendar renders correctly on mobile (day view default on small screens, week view on desktop)
- Permissions enforced — barber A cannot edit barber B's booking even via the API
- Walk-in creation works and respects double-booking constraint

**Security notes:**
- Every mutation Server Action re-checks: is user authenticated? what's their role? is the target booking theirs (if barber)?
- Audit log entries written for every mutation (we'll add an audit table in a phase 2 enhancement; for now just structured logs with userId, action, targetId)

---

#### Commit 16: Time off management
**Goal:** Barbers add their own time off; super admin can add for anyone.

**Tasks:**
- Page lists current and upcoming time off entries
- Create/edit modal: barber (super admin picks, barber locked to self), start datetime, end datetime, optional reason
- Past entries are read-only
- Validation: end > start, end is in the future for new entries
- Deleting an entry is allowed but warn if it overlaps existing bookings (don't auto-cancel them; show a list and let the admin handle)

**Definition of done:**
- Time off entries affect availability immediately (booking flow no longer shows those slots)
- Overlap warning works

**Security notes:** Barber-role users cannot create time off for another barber via crafted form input — Server Action validates `barberId === session.user.barberId` for barber role.

---

#### Commit 17: Super admin — barbers, services, settings management
**Goal:** Full CRUD for content tables behind super admin permission.

**Tasks:**
- **Barbers page:**
  - List all barbers (active and inactive)
  - Create barber: name (BG/EN), bio (BG/EN), photo upload, optional working hours override, optional user account creation
  - When creating a user account: generate a strong random password, email it to the new barber via Resend with instructions to change on first login
  - Edit/deactivate
- **Services page:**
  - List all services
  - Create/edit: name (BG/EN), description (BG/EN), duration, price, display order, active
- **Settings page:**
  - Buffer minutes
  - Cancellation window hours
  - Booking horizon days
  - Slot granularity
  - Shop email, phone
  - Default working hours (template for new barbers)
- **Photo upload for barbers:** Use Cloudinary upload widget with unsigned uploads + an upload preset that restricts file types, size, and dimensions
- Use Cloudinary's transformation URLs for serving (auto format, auto quality, responsive sizes)

**Definition of done:**
- Super admin can fully manage barbers and services
- Changes reflect on the public site after revalidation
- Cloudinary upload works with size/type restrictions
- Inviting a barber via email works end-to-end

**Security notes:**
- Cloudinary unsigned upload preset must restrict: max file size (5 MB), allowed formats (jpg, png, webp), folder (`puro-barbershop/barbers`), max dimensions
- Even with these restrictions, validate Cloudinary response server-side before saving the URL to the DB
- Generated temporary passwords sent by email must be ≥ 16 chars, use crypto.randomBytes, and force change on first login
- Implement page revalidation: after barber/service edits, call `revalidatePath('/[locale]', 'layout')` so public site updates

---

### PHASE 5 — Compliance & analytics

#### Commit 18: Cookie info page (no banner)
**Goal:** Document our minimal cookie use; no consent banner required.

**Rationale:** We removed analytics. After audit, the site sets only strictly-necessary cookies (auth session for admin, locale preference for user choice). Strictly-necessary cookies are exempt from consent under ePrivacy. The single third-party content surface (Instagram embed) uses the click-to-load pattern (commit 7) where the click itself is consent. No global banner is required.

**Tasks:**
- Create the cookie info page (already scaffolded in commit 8). Content from `docs/legal/PRIVACY_POLICY_TEMPLATE.md` already covers this — surface it as a dedicated page for discoverability.
- Add a footer link "Cookie info" in both locales
- Add a small notice in the IG gallery placeholder that explicitly says: "Loading this content connects to Instagram, which may set cookies under their policy. Click to load."

**Definition of done:**
- Cookie info page accessible from footer
- IG gallery placeholder has the disclosure copy
- DevTools Network tab shows zero third-party requests on first homepage load (no analytics, no maps iframe, no IG embed)
- Auth session and locale cookies still work normally

**Security notes:**
- If analytics is added later, this commit needs to be revisited and a real consent banner introduced
- The auth cookie must be `HttpOnly`, `Secure`, `SameSite=Lax`
- The locale cookie can be `SameSite=Lax`, not `HttpOnly` (client reads it for switching)
- No marketing or tracking cookies under any circumstances without revisiting this commit

---

#### Commit 19: SEO, structured data, sitemap
**Goal:** Properly indexable, rich previews on social shares.

**Tasks:**
- Per-page metadata via `generateMetadata`
- Open Graph + Twitter card on homepage
- `og-image.jpg` (1200×630) with logo + slogan — create a placeholder, the human owner can replace
- `robots.txt`: allow all except `/admin/*` and `/api/*`
- `sitemap.xml`: generated dynamically — homepage and legal pages per locale; do NOT include `/book` step URLs or admin
- `JSON-LD LocalBusiness` schema on homepage and location section:
  - `@type`: HairSalon
  - name, address, telephone, openingHours, geo, image, sameAs (Instagram URL)
  - priceRange: `$$`
- Hreflang tags between BG and EN versions

**Definition of done:**
- Rich Results Test (Google) validates LocalBusiness schema
- Sharing the URL on Facebook/Twitter/Telegram shows correct preview
- `robots.txt` and `sitemap.xml` accessible at root

**Security notes:**
- Do not include admin URLs in the sitemap
- `robots.txt` should explicitly `Disallow: /admin/` and `Disallow: /api/` (defense in depth — security through obscurity is not security, but no need to advertise)

---

### PHASE 6 — Production readiness

#### Commit 20: Cron jobs (reminders + data retention)
**Goal:** Daily background tasks for reminders and GDPR data retention.

**Tasks:**
- Use Vercel Cron Jobs (free on Hobby for 2 crons)
- Create `src/app/api/cron/reminders/route.ts`:
  - Runs hourly
  - Verify `CRON_SECRET` matches header `Authorization: Bearer <secret>`
  - Find bookings 23–25h in the future with `reminderSent = false`
  - Send reminder email, set `reminderSent = true`
- Create `src/app/api/cron/retention/route.ts`:
  - Runs daily at 03:00 Europe/Sofia
  - Verify cron secret
  - Delete bookings where status IN ('completed', 'cancelled', 'no_show') AND `endDatetime < now() - interval '12 months'`
  - Log count of deleted rows
- Add cron schedule in `vercel.json`

**Definition of done:**
- Cron endpoints reject requests without correct secret with 401
- Both crons execute on schedule (verify via Vercel dashboard)
- Reminder emails sent at correct time

**Security notes:**
- `CRON_SECRET` is a server-only env var, never exposed
- Cron endpoints rate-limit by IP as well (defense in depth)
- Retention deletion is irreversible — test thoroughly in dev before enabling in prod

---

#### Commit 21: Security headers, CSP, hardening
**Goal:** Production-grade security headers; passes Mozilla Observatory A or higher.

**Tasks:**
- Add `next.config.ts` headers configuration:
  - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
  - `X-Frame-Options: DENY` (except where we need iframes — adjust per route)
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
  - `Content-Security-Policy`:
    - `default-src 'self'`
    - `script-src 'self' 'unsafe-inline'` (inline needed for Next.js; consider nonce-based later)
    - `style-src 'self' 'unsafe-inline'`
    - `img-src 'self' data: https: blob:` (Cloudinary, IG via LightWidget)
    - `font-src 'self'`
    - `connect-src 'self' *.upstash.io`
    - `frame-src 'self' https://lightwidget.com https://cdn.lightwidget.com`
    - `frame-ancestors 'none'`
- Run `npm audit` and resolve all high/critical
- Run Mozilla Observatory and Lighthouse Security scan; iterate until ≥ A
- Document Vercel deployment settings in `README.md`:
  - Branch protection
  - Environment variables per environment (preview, prod)
  - Domain configuration

**Definition of done:**
- Mozilla Observatory: A or higher
- Lighthouse: all scores ≥ 90 on homepage
- `npm audit` clean

**Security notes:** CSP is the single most impactful header. Test thoroughly — broken CSP breaks the site silently. Use `Content-Security-Policy-Report-Only` first if needed, then enforce.

---

#### Commit 22: E2E test, CI/CD, README
**Goal:** Automated checks + deployment workflow documented.

**Tasks:**
- Write one Playwright E2E test in `tests/e2e/booking.spec.ts`:
  - Land on homepage, click "Book Now"
  - Select first service, first barber, today + earliest slot
  - Fill details, submit
  - Assert confirmation page shows
- Configure GitHub Actions `.github/workflows/ci.yml`:
  - On PR: install, lint, typecheck, unit tests, build
  - Cache `node_modules` and Next.js build
- Configure Vercel:
  - GitHub integration (preview deploys per PR, prod on `main`)
  - Environment variables per environment
- Update `README.md` with:
  - Project overview
  - Local setup steps
  - Tech stack
  - Deployment process
  - Common tasks (add a barber, change services, etc.) for the human owner
  - Where to find logs, how to recover passwords, etc.
- Add `OPERATIONS.md` for the human owner — non-technical guide for everyday admin tasks

**Definition of done:**
- CI passes on a fresh PR
- E2E test runs and passes
- README and OPERATIONS clear enough that the human owner can do common tasks without the agent

**Security notes:**
- E2E tests use a separate test database (Neon branch)
- CI does NOT have access to production secrets
- Secrets only injected at deploy time via Vercel

---

## 9. Post-launch checklist (human owner)

Before going live, the human owner must:
- [ ] Change the seeded super admin password
- [ ] Replace all `[PLACEHOLDER:*]` values with real data
- [ ] Verify privacy policy with a Bulgarian data protection professional
- [ ] Configure DNS in Cloudflare to point to Vercel
- [ ] Set up SPF, DKIM, DMARC for `purobarbershop.com` to keep Resend emails out of spam
- [ ] Create the LightWidget account and configure with the Puro IG
- [ ] Sign DPAs with all processors: Neon, Vercel, Resend, Cloudinary, Upstash, LightWidget. Configure EU regions where available.
- [ ] Take or supply real photography (hero, barbers, about section)
- [ ] Submit the sitemap to Google Search Console
- [ ] Register the LocalBusiness in Google Business Profile
- [ ] Test the booking flow end-to-end with real data
- [ ] Make a test booking 25 hours out and verify the reminder lands
- [ ] Test cancellation from the email link
- [ ] Verify backups: Neon does daily snapshots on Free; document the recovery process

## 10. Phase 2 candidates (do not build now)

Documented so they're not forgotten:
- SMS reminders via a Bulgarian SMS provider
- Email blacklist for no-show abusers (the table is already created)
- Custom Instagram Graph API integration replacing LightWidget
- Loyalty/rewards (book N times, get a discount)
- Gift cards
- Online payments (Stripe/Revolut Business with BGN)
- Multi-location support (the schema doesn't model location yet)
- Audit log table for admin actions
- Push notifications for barbers (PWA)
- AI scheduling assistant (suggesting optimal slots)

---

## 11. Things to never compromise on

If the agent ever finds itself tempted to skip these, stop and escalate to the human:

1. **The DB-level unique constraint on `(barberId, startDatetime) WHERE status='confirmed'`.** It is the only thing standing between you and angry double-booked customers. Without it, no amount of application-level checking helps under concurrency.
2. **Server-side authorization on every mutation.** Hidden UI is not security. Every Server Action must verify the session and role.
3. **Zod validation at every trust boundary.** Inputs from the user, from URLs, from API responses, from environment variables. All untrusted.
4. **No PII in logs.** Mask emails and phones. Even errors.
5. **Consent before analytics.** Anywhere in EU, this is non-negotiable.
6. **Self-hosted fonts and no Google Fonts via link.** Eliminates a third-party request and the GDPR question that comes with it.
7. **Generic error messages to users, detailed errors in server logs.** Never leak internal state.
8. **Pre-commit hooks must stay enabled.** Don't `--no-verify` a commit.

---

**End of plan.** When ready, start with Commit 1 and work in order. Each PR should reference the commit number from this document.
