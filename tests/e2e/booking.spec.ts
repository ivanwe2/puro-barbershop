import { test, expect } from "@playwright/test";
import { format } from "date-fns";

test("booking flow — single-screen form", async ({ page }) => {
  // Land on homepage
  await page.goto("/bg");
  await expect(page).toHaveTitle(/Puro Barbershop/);

  // Click "Book Now" → dedicated booking page
  await page
    .getByRole("link", { name: /Запази час/i })
    .first()
    .click();
  await expect(page).toHaveURL(/\/book/);

  // Service + barber default to sensible values (first service / no preference).
  // Pick today's date to load available time slots.
  const today = format(new Date(), "yyyy-MM-dd");
  await page.locator('input[type="date"]').fill(today);

  // Wait for slots and choose the first available time chip.
  const timeChip = page.getByRole("button", { name: /^\d{2}:\d{2}$/ });
  await expect(timeChip.first()).toBeVisible({ timeout: 10000 });
  await timeChip.first().click();

  // Fill contact details.
  await page.getByPlaceholder(/Име/i).fill("Иван Иванов");
  await page.getByPlaceholder(/\+359/).fill("+359888123456");
  await page.getByPlaceholder(/example/i).fill("test@example.com");

  // Consent + submit.
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: /Потвърди/i }).click();

  // Assert confirmation shows.
  await expect(page.getByRole("heading", { name: /потвърден/i })).toBeVisible({ timeout: 15000 });
});
