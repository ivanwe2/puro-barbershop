import type { Page } from "@playwright/test";
import postgres from "postgres";
import crypto from "node:crypto";
import { isClosedWeekday } from "../../src/lib/shop-hours";

// These E2E tests drive the real app and assert against the real dev services
// (Postgres on :5432, Mailpit on :8025). Start the stack first:
//   docker compose up -d
// Then run:  npm run test:e2e

const DB_URL =
  process.env.E2E_DATABASE_URL ||
  process.env.DATABASE_URL ||
  "postgresql://puro:puro_dev_only@localhost:5432/puro_barbershop";

// Short idle timeout so the Playwright worker can exit cleanly after tests.
export const sql = postgres(DB_URL, { idle_timeout: 2, max: 2 });

export const MAILPIT = process.env.MAILPIT_URL || "http://localhost:8025";
export const ADMIN_EMAIL = "admin@purobarbershop.com";
export const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "DevPuroAdmin2026!Secure";

export async function clearMail(): Promise<void> {
  await fetch(`${MAILPIT}/api/v1/messages`, { method: "DELETE" });
}

type Mail = { ID: string; Subject: string; HTML: string; Text: string };

/** Poll Mailpit for a message matching subject + recipient, up to `timeoutMs`. */
export async function waitForMail(
  subjectIncludes: string,
  toIncludes: string,
  timeoutMs = 8000,
): Promise<Mail | null> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const list = await (await fetch(`${MAILPIT}/api/v1/messages?limit=50`)).json();
    const m = (list.messages || []).find(
      (x: { Subject: string; To: { Address: string }[] }) =>
        x.Subject.includes(subjectIncludes) && x.To.some((t) => t.Address.includes(toIncludes)),
    );
    if (m) return (await (await fetch(`${MAILPIT}/api/v1/message/${m.ID}`)).json()) as Mail;
    await new Promise((r) => setTimeout(r, 500));
  }
  return null;
}

/** Log into the admin panel and wait for the dashboard. */
export async function login(page: Page): Promise<void> {
  await page.goto("/en/admin/login");
  await page.fill("#email", ADMIN_EMAIL);
  await page.fill("#password", ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/admin", { timeout: 30000 });
}

const pad = (n: number) => String(n).padStart(2, "0");
export const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/**
 * "yyyy-MM-dd" for `daysAhead` from now, rolled forward past any day the shop
 * is closed. Without this, a run on the wrong weekday lands on a Sunday, finds
 * no slots and fails for a reason that has nothing to do with the test.
 */
export function openDateAhead(daysAhead: number): string {
  const d = new Date(Date.now() + daysAhead * 86400000);
  while (isClosedWeekday(d.getDay())) d.setDate(d.getDate() + 1);
  return ymd(d);
}

/** Same HMAC cancellation token the server generates (keyed on AUTH_SECRET). */
export function cancellationToken(bookingId: number): string {
  const secret = process.env.AUTH_SECRET || "";
  return crypto.createHmac("sha256", secret).update(String(bookingId)).digest("hex").slice(0, 32);
}
