import { test, expect } from "@playwright/test";

test("booking flow — select service, barber, date/time, submit details", async ({ page }) => {
  // Land on homepage
  await page.goto("/bg");
  await expect(page).toHaveTitle(/Puro Barbershop/);

  // Click "Book Now"
  await page
    .getByRole("link", { name: /Запази час/i })
    .first()
    .click();
  await expect(page).toHaveURL(/\/book/);

  // Step 1: Select first service
  const serviceCards = page.getByRole("button").filter({ hasText: /мин/i });
  await expect(serviceCards.first()).toBeVisible();
  await serviceCards.first().click();

  // Click Next
  await page.getByRole("button", { name: /Напред/i }).click();

  // Step 2: Select first barber
  const barberButtons = page.getByRole("button").filter({ hasText: /Козметик/i });
  await expect(barberButtons.first()).toBeVisible();
  await barberButtons.first().click();

  // Click Next
  await page.getByRole("button", { name: /Напред/i }).click();

  // Step 3: Select today's date and first available time slot
  // The calendar should be visible
  await page.waitForSelector('[data-slot="calendar"]', { timeout: 10000 });

  // Click on today's date cell
  const today = new Date();
  const todayFormatted = today.getDate().toString();
  await page.getByRole("gridcell", { name: todayFormatted }).first().click();

  // Wait for slots to load and click the first one
  await page.waitForSelector('[data-slot="slot"]', { timeout: 10000 });
  await page
    .getByRole("button", { name: /\d{2}:\d{2}/ })
    .first()
    .click();

  // Click Next
  await page.getByRole("button", { name: /Напред/i }).click();

  // Step 4: Fill details and submit
  await expect(page.getByLabel(/Име/i)).toBeVisible();
  await page.getByLabel(/Име/i).fill("Иван Иванов");
  await page.getByLabel(/Имейл/i).fill("test@example.com");
  await page.getByLabel(/Телефон/i).fill("+359888123456");

  // Check consent
  await page.getByRole("checkbox").check();

  // Submit
  await page.getByRole("button", { name: /Потвърди/i }).click();

  // Assert confirmation page shows
  await expect(page.getByText(/потвърден/i)).toBeVisible({ timeout: 15000 });
});
