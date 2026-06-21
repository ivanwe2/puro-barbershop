# Security Policy — Puro Barbershop

## Scope

This document covers the security posture of the Puro Barbershop website (`purobarbershop.com`).

## Reporting a vulnerability

If you discover a security vulnerability, please **do not** open a public GitHub issue.  
Contact the site owner directly at `[PLACEHOLDER:shop_email]`.

---

## Security checklist (enforced per commit)

This is a summary. The authoritative checklist is in `docs/PURO_BARBERSHOP_BUILD_PLAN.md` §6.

### Secrets & config

- No secrets or credentials in code or git history
- `.env.local` is gitignored; `.env.example` has all keys empty
- All env vars validated through `src/lib/env.ts` with Zod
- Server-only env vars are never prefixed `NEXT_PUBLIC_`

### Input handling

- All Server Action and API route inputs validated with Zod
- No raw SQL with string concatenation — Drizzle parameterized queries only
- No `dangerouslySetInnerHTML` without sanitization

### Authentication & authorization

- Every admin route protected by middleware
- Every admin Server Action re-checks auth + role (defense in depth)
- No authorization logic on the client

### Database

- Migrations are forward-only
- UNIQUE constraints prevent double-bookings at the DB level
- No N+1 queries in lists; no `SELECT *` in user-facing queries

### Rate limiting

- Public mutation endpoints rate-limited per IP
- Booking endpoint rate-limited per email and per phone
- Auth endpoints rate-limited per IP

### Output & XSS

- No user-supplied HTML rendered without escaping
- Email templates do not interpolate raw user input into HTML attributes
- All external links use `rel="noopener noreferrer"`

### Headers & transport

- HTTPS only (Vercel default + HSTS)
- CSP configured (see Commit 21)
- `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`

### Privacy & GDPR

- Only collect: name, email, phone, optional notes
- No PII in logs (emails masked to `j***@example.com`)
- Cancellation tokens are HMAC-signed and time-limited
- Booking records purged after 12 months

---

## Known transitive dependency advisories

| Package                | Advisory                                   | Fix status                                                                                                |
| ---------------------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| `postcss` (via `next`) | GHSA-qx2v-qp2m-jg93 — XSS in CSS stringify | Upstream Next.js fix required; `npm audit fix --force` would break Next.js. Monitoring for Next.js patch. |
