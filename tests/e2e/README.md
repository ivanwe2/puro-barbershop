# End-to-end tests

These Playwright specs drive the **real running app** and assert against the
real dev services — Postgres (`:5432`) and Mailpit (`:8025`). They create and
then clean up their own data.

## Prerequisites

Start the full dev stack first:

```bash
docker compose up -d
```

The Playwright config loads `.env` (for `DATABASE_URL`, `SEED_ADMIN_PASSWORD`,
`CRON_SECRET`) and reuses the already-running app at `http://localhost:3000`
(it will not spawn a second server).

## Run

```bash
npm run test:e2e            # all specs
npx playwright test admin   # a single file
npx playwright test --ui    # interactive
```

## Coverage

| Spec                     | What it verifies                                                                                                                                       |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `booking.spec.ts`        | Public single-screen booking form (bg).                                                                                                                |
| `booking-cancel.spec.ts` | Booking → **localized** confirmation email (Sofia time) + barber notification → cancellation via emailed link → cancellation email. Runs in en and bg. |
| `admin.spec.ts`          | Login, all admin pages render, barber CRUD + invite, settings, time-off, walk-in + week-nav refetch + mark-completed. Asserts DB state.                |
| `reminders.spec.ts`      | Reminder cron emails a ~24h booking and flips `reminderSent` (skipped if `CRON_SECRET` unset).                                                         |

## Notes

- Tests log in repeatedly; the login rate-limit is 10/15 min per IP, so avoid
  re-running many times in quick succession (or restart the app to reset the
  in-memory limiter).
- Data is namespaced (`Test QA…`, `Walk QA…`, `e2e-…@example.com`) and removed
  in `afterAll`, but a hard-killed run may leave rows behind — the cleanup
  queries at the top of each `afterAll` are safe to run again.
