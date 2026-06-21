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

**Status:** 🔲 TODO

---

### Commit 3: Database schema, migrations, seed

**Status:** 🔲 TODO

---

### Commit 4: Design tokens, fonts, base layout, header & footer

**Status:** 🔲 TODO

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
