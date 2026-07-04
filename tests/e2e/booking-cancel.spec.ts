import { test, expect, type Page } from "@playwright/test";
import { sql, clearMail, waitForMail, ymd } from "./helpers";

// Book a slot end-to-end. Uses name-based inputs so it works in any locale.
async function book(page: Page, locale: "bg" | "en", barberLabel: string) {
  const email = `e2e-${locale}-${Date.now()}@example.com`;
  const date = ymd(new Date(Date.now() + 5 * 86400000));

  await page.goto(`/${locale}/book`, { waitUntil: "networkidle" });
  await page.waitForSelector("select", { timeout: 20000 });
  await page.locator("select").nth(1).selectOption({ label: barberLabel });
  await page.locator('input[type="date"]').fill(date);

  const chip = page.getByRole("button", { name: /^\d{2}:\d{2}$/ }).first();
  await expect(chip).toBeVisible({ timeout: 20000 });
  const slot = (await chip.innerText()).trim();
  await chip.click();

  await page.locator('input[name="name"]').fill("E2E Tester");
  await page.locator('input[name="phone"]').fill("+359888123456");
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[type="checkbox"]').check();
  await page.locator('button[type="submit"]').click();

  // Locale-agnostic success signal: the booking row appears.
  await expect
    .poll(async () => (await sql`select id from bookings where customer_email = ${email}`).length, {
      timeout: 20000,
    })
    .toBe(1);

  return { email, slot };
}

test.afterAll(async () => {
  await sql`delete from bookings where customer_email like 'e2e-%@example.com'`;
});

test("booking → localized confirmation email → cancellation (en)", async ({ page }) => {
  await clearMail();
  const { email, slot } = await book(page, "en", "Seney");

  const conf = await waitForMail("Booking Confirmation", email);
  expect(conf, "confirmation email delivered").not.toBeNull();
  expect(conf!.HTML).toContain(slot); // Sofia wall-clock time
  expect(conf!.HTML).toContain("Your booking is confirmed");

  // Barber notification goes to the linked user (admin), always in Bulgarian.
  expect(await waitForMail("Нова резервация", "admin@purobarbershop.com")).not.toBeNull();

  // Cancel via the emailed link.
  const row = (
    await sql`select cancellation_token from bookings where customer_email = ${email}`
  )[0]!;
  await page.goto(`/en/book/cancel/${row.cancellation_token}`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Cancel Booking" }).click();

  await expect
    .poll(
      async () =>
        (await sql`select status from bookings where customer_email = ${email}`)[0]?.status,
      {
        timeout: 15000,
      },
    )
    .toBe("cancelled");
  expect(await waitForMail("Booking Cancelled", email)).not.toBeNull();
});

test("booking → confirmation email is Bulgarian (bg)", async ({ page }) => {
  await clearMail();
  const { email, slot } = await book(page, "bg", "Сеней");

  const conf = await waitForMail("Потвърждение за резервация", email);
  expect(conf, "Bulgarian confirmation email delivered").not.toBeNull();
  expect(conf!.HTML).toContain(slot);
  expect(conf!.HTML).toContain("Вашата резервация е потвърдена");
});
