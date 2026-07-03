import { test, expect } from "@playwright/test";
import { sql, clearMail, waitForMail } from "./helpers";

const CRON_SECRET = process.env.CRON_SECRET;

test("reminder cron emails a booking ~24h out and flips reminderSent", async ({ request }) => {
  test.skip(!CRON_SECRET, "CRON_SECRET not set");
  await clearMail();

  const email = `reminder-${Date.now()}@example.com`;
  await sql`
    insert into bookings
      (service_id, barber_id, customer_name, customer_email, customer_phone,
       start_datetime, end_datetime, status, cancellation_token, locale)
    select
      (select id from services where active limit 1),
      (select id from barbers where active limit 1),
      'Reminder QA', ${email}, '+359888123456',
      now() + interval '24 hours', now() + interval '24 hours 30 minutes',
      'confirmed', ${"qa-tok-" + Date.now()}, 'en'`;

  const res = await request.get("/api/cron/reminders", {
    headers: { Authorization: `Bearer ${CRON_SECRET}` },
  });
  expect(res.ok()).toBeTruthy();
  expect((await res.json()).sent).toBeGreaterThanOrEqual(1);

  expect(await waitForMail("Booking Reminder", email)).not.toBeNull();
  const [row] = await sql`select reminder_sent from bookings where customer_email = ${email}`;
  expect(row.reminder_sent).toBe(true);

  await sql`delete from bookings where customer_email = ${email}`;
});
