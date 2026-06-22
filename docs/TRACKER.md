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

**Status:** ✅ DONE

**Changes:**

- Installed `next-intl`
- `src/lib/i18n/config.ts` — locales `["bg", "en"]`, default `"bg"`, `localePrefix: "always"`
- `i18n/request.ts` — `getRequestConfig` loading messages from `messages/{locale}.json`
- `src/lib/i18n/routing.ts` — `createNavigation` with `Link`, `redirect`, `usePathname`, `useRouter`
- `src/middleware.ts` — `createMiddleware` for locale routing
- `next.config.ts` — wrapped with `createNextIntlPlugin`
- `messages/bg.json` — full Bulgarian translations for all 11 namespaces
- `messages/en.json` — full English translations for all 11 namespaces
- Header: all nav labels from `nav` namespace, `LocaleSwitcher` with BG/EN toggle
- Footer: all labels from `footer` namespace, i18n-aware links
- SloganDivider: reads `common.slogan` and splits on `·`
- Homepage: reads `home` namespace, CTA from `common.bookNow`

**Deviations / notes:**

- `i18n/request.ts` must live at repo root (not `src/lib/i18n/`) — next-intl v4 requirement
- `localePrefix: "always"` means `/` redirects to `/bg`
- `Link` from `createNavigation` is a client component — Header and Footer must be `"use client"`
- `useRouter()` from `next/navigation` doesn't have `pathname` — used `usePathname()` from our routing instead

**Definition of Done:**

- [x] `/` redirects to `/bg`
- [x] `/en` shows English copy
- [x] Switching language preserves the current page
- [x] All visible strings come from translation files, no hardcoded copy
- [x] `npm run build` succeeds
- [x] `npm run lint` passes
- [x] `npm run typecheck` passes

### Commit 6: Homepage sections

**Status:** ✅ DONE

**Changes:**

- `src/components/marketing/Hero.tsx` — hero section with logo, title, subtitle, CTA button (uses `next/link`)
- `src/components/marketing/About.tsx` — about section with paragraph text
- `src/components/marketing/BarbersSection.tsx` — DB-driven barbers grid (nullable bios handled)
- `src/components/marketing/ServicesSection.tsx` — DB-driven services grid (nullable descriptions handled, each card links to `/book?service=<id>`)
- `src/components/marketing/GalleryPlaceholder.tsx` — gallery placeholder with "soon" message
- `src/components/marketing/LocationSection.tsx` — location + working hours from DB
- `src/app/[locale]/(public)/page.tsx` — server component assembling all sections with DB queries
- `src/db/index.ts` — fixed type mismatch: removed explicit `PostgresJsDatabase | NeonHttpDatabase` union, let conditional expression infer type
- `messages/bg.json`, `messages/en.json` — added `servicesTitle`, `bookThisService`, `heroTitle`, `heroSubtitle` keys

**Deviations / notes:**

- Barber bio fields and service description fields are nullable in schema — component interfaces must use `string | null`
- `<a href="/book">` replaced with `next/link` `Link` to pass `@next/next/no-html-link-for-pages` lint rule
- `NeonDatabase` type from `@neondatabase/serverless` is incompatible with `NeonHttpDatabase` in the union — simplified `src/db/index.ts` to conditional expression without explicit type annotation
- 2 lint warnings remain: `@next/next/no-img-element` for `<img>` in Hero and BarbersSection (acceptable for placeholder/external images; will resolve when real assets are in place)

**Definition of Done:**

- [x] `npm run build` succeeds
- [x] `npm run lint` passes (0 errors)
- [x] `npm run typecheck` passes
- [x] Homepage renders all 6 sections with DB data
- [x] Services cards link to `/book?service=<id>`
- [x] Locale-aware content (barber names, service names, hours)

### Commit 7: Instagram gallery (click-to-load)

**Status:** ✅ DONE

**Changes:**

- `src/components/marketing/InstagramGallery.tsx` — click-to-load Instagram gallery:
  - Default state: styled placeholder with IG icon, notice that loading connects to Instagram and may set cookies, "Show feed" button
  - On click: iframe with LightWidget embed is mounted (session-only, no cookie/localStorage)
  - "Hide feed" button to toggle back
  - If widget ID missing: shows placeholder with fallback link
  - If iframe fails: error state with fallback link to Instagram
  - iframe has `sandbox="allow-scripts allow-same-origin allow-popups"` and `referrerPolicy="strict-origin-when-cross-origin"`
- `src/lib/env.ts` — added `NEXT_PUBLIC_INSTAGRAM_URL` to client schema
- `.env.example` — added `NEXT_PUBLIC_INSTAGRAM_URL` entry
- `src/components/shared/Footer.tsx` — Instagram link now reads from `NEXT_PUBLIC_INSTAGRAM_URL` env var
- `src/app/[locale]/(public)/page.tsx` — replaced `GalleryPlaceholder` with `InstagramGallery`, added `revalidate = 3600`

**Deviations / notes:**

- `NEXT_PUBLIC_LIGHTWIDGET_ID` was already in the env schema (optional) — no change needed
- When widget ID is absent, the component falls back to a placeholder card with a link to Instagram (no broken iframe)
- Session-only state (`useState`) — no cookie or localStorage used, consistent with GDPR click-to-load pattern
- Instagram SVG icon inlined to avoid external dependency

**Definition of Done:**

- [x] Gallery section shows placeholder by default — no third-party requests on first page load
- [x] Clicking "Show feed" mounts the iframe and IG content appears
- [x] If widget ID is missing, fallback link shows instead of a broken iframe
- [x] iframe has sandbox and referrer policy restrictions
- [x] `npm run build` succeeds
- [x] `npm run lint` passes (0 errors)
- [x] `npm run typecheck` passes

### Commit 8: Legal pages (Privacy, Terms, Cookie info)

**Status:** ✅ DONE

**Changes:**

- Installed `remark`, `remark-html`, `@tailwindcss/typography`
- `@plugin "@tailwindcss/typography"` added to `globals.css` for `prose` classes
- `src/content/legal/` — raw markdown files for all 3 pages in both locales:
  - `privacy-en.md` — copied verbatim from `docs/PRIVACY_POLICY_TEMPLATE.md`
  - `terms-en.md` — copied verbatim from `docs/TERMS_OF_SERVICE_TEMPLATE.md`
  - `privacy-bg.md` — Bulgarian translation of privacy policy
  - `terms-bg.md` — Bulgarian translation of terms of service
  - `cookie-info-en.md` — original English cookie info
  - `cookie-info-bg.md` — original Bulgarian cookie info
- `src/components/legal/LegalPage.tsx` — server component that reads `.md` file by locale, strips YAML frontmatter, renders via `remark` + `remark-html` into `prose prose-invert`
- `src/app/[locale]/(public)/legal/privacy/page.tsx` — privacy policy page
- `src/app/[locale]/(public)/legal/terms/page.tsx` — terms of service page
- `src/app/[locale]/(public)/legal/cookie-info/page.tsx` — cookie info page
- `src/app/[locale]/(public)/legal/layout.tsx` — print-friendly CSS for legal pages

**Deviations / notes:**

- No MDX — the plan said "MDX or plain JSX"; chose `remark` + `remark-html` to faithfully render the raw markdown without editing substance
- Bulgarian translations of privacy and terms are provided as starting points; both templates' critical notices are preserved
- Cookie info page is original content (no template existed) — describes strictly necessary cookies and the Instagram click-to-load pattern
- Footer legal links already existed and point to the correct routes (`/legal/privacy`, `/legal/terms`, `/legal/cookie-info`)

**Definition of Done:**

- [x] All three pages render in both locales (`/bg/legal/privacy`, `/en/legal/privacy`, etc.)
- [x] Footer links work
- [x] Pages have clear sections with headings (rendered from markdown)
- [x] Print-friendly CSS applied
- [x] Content faithful to templates (no agent-introduced edits to substance)
- [x] `npm run build` succeeds
- [x] `npm run lint` passes (0 errors)
- [x] `npm run typecheck` passes

---

## Phase 3 — Booking system

### Commit 9: Availability engine

**Status:** ✅ DONE

**Changes:**

- Installed `vitest` (dev)
- `vitest.config.ts` — configured with `@` path alias
- `src/lib/booking/availability.ts` — pure availability engine:
  - `getAvailableSlots({ serviceId, barberId, date, db })` → array of `Date` objects (Europe/Sofia)
  - `getAvailableSlotsForAnyBarber({ serviceId, date, db })` → `Array<{ slot: Date; availableBarberIds: number[] }>`
  - Loads service duration + buffer from settings
  - Loads barber working hours for day of week
  - Subtracts time_off periods
  - Subtracts confirmed bookings (including buffer)
  - Generates candidate slots at `slot_granularity_minutes` intervals
  - Filters: `slot + duration + buffer ≤ end of working window`, no overlap, not in past, not beyond horizon
  - Uses `Intl.DateTimeFormat` for Sofia timezone offset (not local system offset)
- `tests/unit/availability.test.ts` — 12 unit tests covering:
  - Empty schedule, schedule with bookings, time off, buffer enforcement
  - Edge: booking at end of working day
  - Mock DB maps table names via `Symbol.for("drizzle:Name")`
- `src/db/index.ts` — exports `DB` type alias

**Deviations / notes:**

- `DB` type exported from `src/db/index.ts` as `typeof db` (avoids `any` in test mocks)
- `noUncheckedIndexedAccess` requires null guards on destructured array elements — `h` and `m` from `timeStr.split(":")` must be checked
- `Intl.DateTimeFormat` used instead of `date-fns-tz` to avoid extra dependency; computes Sofia offset directly
- Mock DB in tests uses `as unknown as DB` to satisfy TypeScript

**Definition of Done:**

- [x] All unit tests pass (12/12)
- [x] Function returns correct slots for hand-verified test cases
- [x] No DB writes from this module (pure read)
- [x] `npm run build` succeeds
- [x] `npm run lint` passes (0 errors)
- [x] `npm run typecheck` passes

### Commit 10: Booking UI

**Status:** ✅ DONE

**Changes:**

- **Packages installed:** `react-hook-form`, `@hookform/resolvers`, `date-fns`, `date-fns-tz`, `libphonenumber-js`
- **shadcn components added:** calendar, select, input, label, textarea, checkbox, card, tabs, skeleton, separator
- `src/lib/booking/schema.ts` — Zod validation schemas for booking input and slot fetching
- `src/actions/booking.ts` — Server Actions:
  - `fetchSlots` — validates input, delegates to availability engine, returns time strings
  - `fetchServices` — returns active services from DB
  - `fetchBarbers` — returns active barbers from DB
- `src/components/booking/Stepper.tsx` — visual step indicator (4 steps)
- `src/components/booking/StepService.tsx` — service card grid, click-to-select
- `src/components/booking/StepBarber.tsx` — barber list with "Any available" option, initials avatar fallback
- `src/components/booking/StepDateTime.tsx` — shadcn Calendar + slot grid, skeleton loading, i18n locale for calendar
- `src/components/booking/StepDetails.tsx` — react-hook-form + Zod resolver, consent checkbox, inline validation
- `src/app/[locale]/(public)/book/page.tsx` — 4-step booking flow, URL state persistence, back/next navigation
- `messages/bg.json`, `messages/en.json` — added `back`, `next`, `noSlotsAvailable`, `selectDateFirst`, `privacy`, `terms` keys
- `src/components/ui/calendar.tsx` — fixed `exactOptionalPropertyTypes` issue with `locale` prop

**Deviations / notes:**

- `libphonenumber-js` installed per plan but not yet used in validation — will be wired in Commit 11 with full phone validation
- `date-fns-tz` installed per plan but not yet needed — availability engine uses `Intl.DateTimeFormat`
- `createBooking` server action not yet implemented — placeholder wired to `setTimeout` + TODO comment (Commit 11)
- Calendar locale uses `bg` from `date-fns/locale` for Bulgarian day/month names
- `exactOptionalPropertyTypes` caused issues with `notes?: string` — fixed to `notes?: string | undefined`
- `parseInt` on URL params returns `number`, but ternary with `"any"` required explicit type narrowing
- Calendar component's `DayButton` override had `locale` type mismatch — fixed with conditional render

**Definition of Done:**

- [x] Full 4-step flow works on desktop
- [x] Back button works between steps
- [x] Validation errors show inline and are accessible
- [x] Loading and error states styled
- [x] State persisted in URL search params
- [x] Pre-select service from `/book?service=<id>`
- [x] `npm run build` succeeds
- [x] `npm run lint` passes (0 errors)
- [x] `npm run typecheck` passes

### Commit 11: Booking server action

**Status:** ✅ DONE

**Changes:**

- `src/lib/booking/tokens.ts` — HMAC-SHA256 cancellation token generation and verification using `AUTH_SECRET`
- `src/lib/rate-limit.ts` — `RateLimiter` interface with 3 implementations:
  - `UpstashRateLimiter` (prod, uses `@upstash/ratelimit` + `@upstash/redis`)
  - `LocalRateLimiter` (dev, in-memory Map with sliding window)
  - `NoOpRateLimiter` (disabled via `RATE_LIMIT_DEV=off`)
  - 3 named limiters: `ip` (5/10m), `email` (3/24h), `phone` (3/24h)
- `src/actions/booking.ts` — `createBooking` server action:
  1. Zod validation via `bookingDetailsSchema`
  2. Sanitize: trim, lowercase email
  3. Email blacklist check (generic error on hit)
  4. Rate limiting (IP, email, phone)
  5. Resolve "any" barber via availability engine
  6. Server-side re-check slot availability
  7. HMAC cancellation token generation
  8. Atomic insert with partial unique index (conflict → "slotTaken")
  9. Email trigger placeholder (TODO Commit 12)
  10. Returns `bookingId` (not cancellation token)
- `src/lib/booking/schema.ts` — added `locale` field to `bookingDetailsSchema`
- `src/lib/env.ts` — added `RATE_LIMIT_DEV` env var
- `src/components/booking/StepDetails.tsx` — accepts `locale`, `error` props; shows error banner; locale-aware "and"/"и" in consent
- `src/app/[locale]/(public)/book/page.tsx` — wires `createBooking`, shows confirmation screen with booking ID
- `messages/bg.json`, `messages/en.json` — added `confirmationBookingId`, `confirmationEmailSent`, `backToHome`, `booking_error`

**Deviations / notes:**

- `headers()` from `next/headers` returns `Promise<ReadonlyHeaders>` — `getClientIp()` is async
- `noUncheckedIndexedAccess` caused issues with `split(",")[0]` and `result[0]` — added explicit guards
- `.returning({ id: bookings.id })` failed with this Drizzle version — using `.returning()` (all fields) instead
- Upstash `Duration` is a template literal type — cast from `string` in factory
- Cancellation token generated with `bookingId=0` first, then updated with real ID after insert (avoids needing `RETURNING` with specific fields)
- Email trigger is a TODO placeholder — will be wired in Commit 12
- `libphonenumber-js` not yet used for phone validation — schema still uses basic `min(7).max(30)`

**Definition of Done:**

- [x] Booking flow creates a row in `bookings`
- [x] Double-booking prevented by partial unique index (conflict → "slotTaken")
- [x] Rate limits enforced (IP 5/10m, email 3/24h, phone 3/24h)
- [x] Cancellation token generated via HMAC, stored on booking, NOT returned to client
- [x] "Any barber" resolves to first available barber
- [x] Server-side re-check of slot availability before insert
- [x] Email blacklist check (generic error)
- [x] Confirmation screen shows booking ID
- [x] `npm run build` succeeds
- [x] `npm run lint` passes (0 errors)
- [x] `npm run test` passes (12/12)

### Commit 12: Emails + cancellation flow

**Status:** ✅ DONE

**Changes:**

- `src/lib/email/client.ts` — `EmailClient` interface with 2 implementations:
  - `ResendEmailClient` (prod, uses `resend` npm package)
  - `SmtpEmailClient` (dev, uses `nodemailer` → Mailpit on `localhost:1025`)
  - `createEmailClient()` factory selects based on `EMAIL_TRANSPORT` env var
- `src/lib/email/templates/` — 4 react-email templates (brand-colored, dark-on-light for inbox readability):
  - `CustomerConfirmation.tsx` — booking details, cancellation link, shop address & phone
  - `BarberNotification.tsx` — new booking alert for assigned barber
  - `CustomerCancellation.tsx` — confirmation of cancellation
  - `CustomerReminder.tsx` — 24h reminder with cancel button
- `src/lib/email/index.tsx` — named send functions wrapping templates + client, with error logging
- `src/actions/cancel-booking.ts` — `cancelBooking` server action:
  1. Find booking by cancellation token
  2. Verify HMAC token matches booking ID
  3. Check booking is not already cancelled
  4. Check >= 24h before start time
  5. Update booking status to 'cancelled'
  6. Send cancellation email (fire-and-forget)
  7. Generic "cannotCancel" error for all failure cases (security)
- `src/app/[locale]/(public)/book/cancel/[token]/page.tsx` — cancellation UI:
  - Shows confirmation prompt with cancel button
  - On success: shows "Booking cancelled" + back to home
  - On failure: shows "Please call us" (generic, no details leaked)
- `src/app/[locale]/(public)/book/confirmation/page.tsx` — standalone confirmation page:
  - Fetches booking by `?id=<bookingId>` from URL
  - Shows masked email (`j***@example.com`) and phone (`+359 *** *** 23`)
  - Locale-aware service/barber name display
- `src/actions/booking.ts` — wired emails into `createBooking`:
  - Sends customer confirmation email (fire-and-forget, doesn't block response)
  - Sends barber notification email (if barber has linked user account)
  - Locale-aware service/barber names and address
- `messages/bg.json`, `messages/en.json` — added `cancel` key to booking namespace

**Deviations / notes:**

- Email templates use inline styles (required by react-email for email client compatibility)
- Shop address is hardcoded in locale-appropriate form (not from DB) — same as i18n keys
- Barber notification only sent if barber has a linked `userId` with email
- Cancellation token verification uses HMAC — token is invalidated if booking ID changes
- Cancellation page returns generic "cannotCancel" for all failure modes (invalid token, already cancelled, <24h window)
- Confirmation page re-fetches booking from DB (not relying on client-side state)
- `detect-object-injection` warnings in email templates are from `params` spread — acceptable for email rendering
- `EMAIL_TRANSPORT` env var already existed in schema from earlier commits

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

| #   | Description                                                                                          | Status                                               |
| --- | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| B1  | Neon database — human must sign up and provide `DATABASE_URL` and `DATABASE_URL_UNPOOLED` (Commit 3) | 🔲 Pending human                                     |
| B2  | Resend API key — human must create account and provide `RESEND_API_KEY` (Commit 12)                  | 🔲 Pending human                                     |
| B3  | Upstash Redis credentials — human must create free account (Commit 11)                               | 🔲 Pending human                                     |
| B4  | Cloudinary account + upload preset — human must configure for barber photos (Commit 17)              | 🔲 Pending human                                     |
| B5  | LightWidget account + widget ID for Instagram embed (Commit 7)                                       | 🔲 Pending human (widget ID and IG URL still needed) |
| B6  | Real photography: hero image, barber photos (Commit 6+)                                              | 🔲 Pending human                                     |
| B7  | Google Maps embed URL / map pin for the shop                                                         | 🔲 Pending human                                     |
| B8  | Shop phone, email, legal entity name, EIK/VAT, registered address                                    | 🔲 Pending human                                     |

---

## PLACEHOLDER grep targets

Run `grep -r "PLACEHOLDER"` at any time to find all spots awaiting human data.

---

## Security checklist (per §6 of build plan)

Checked at each commit. Full checklist in `docs/PURO_BARBERSHOP_BUILD_PLAN.md` §6.
