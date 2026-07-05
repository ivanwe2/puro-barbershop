import { test, expect } from "@playwright/test";
import { sql, login } from "./helpers";

// Per-barber pricing: the landing selector swaps prices per barber, and the
// admin matrix persists overrides. Seeds two overrides on the first service so
// the "from" range and a barber-specific price are both exercised, then cleans
// up after itself.
test.describe("per-barber pricing", () => {
  let serviceId: number;
  let barberIds: number[];
  let barber0Name: string;

  test.beforeAll(async () => {
    const svc = await sql`select id from services where active order by display_order limit 1`;
    serviceId = svc[0]!.id;
    const bar =
      await sql`select id, name_en from barbers where active order by display_order limit 2`;
    barberIds = bar.map((b) => b.id);
    barber0Name = bar[0]!.name_en;
    // barber0 = 14.00 (pricier), barber1 = 11.00 → range "from €11".
    await sql`
      insert into barber_service_prices (barber_id, service_id, price_eur)
      values (${barberIds[0]}, ${serviceId}, '14.00'), (${barberIds[1]}, ${serviceId}, '11.00')
      on conflict (barber_id, service_id) do update set price_eur = excluded.price_eur`;
  });

  test.afterAll(async () => {
    await sql`delete from barber_service_prices where service_id = ${serviceId}`;
  });

  test("landing selector swaps prices per barber", async ({ page }) => {
    await page.goto("/en");
    const services = page.locator("#services");
    // Default "Everyone": lowest price with a "from" prefix.
    await expect(services).toContainText("from");
    await expect(services).toContainText("€11");
    // Pick the pricier barber → their exact price replaces the range.
    await page.getByRole("button", { name: barber0Name, exact: true }).click();
    await expect(services).toContainText("€14");
  });

  test("admin pricing matrix persists an override", async ({ page }) => {
    await login(page);
    await page.goto("/en/admin/pricing");
    await expect(page.getByRole("heading", { name: /pricing/i })).toBeVisible();

    const cell = page.getByTestId(`price-${barberIds[1]}-${serviceId}`);
    await expect(cell).toHaveValue("11.00");
    await cell.fill("9.50");
    await page.getByRole("button", { name: /save/i }).click();
    await expect(page.getByText(/prices saved/i)).toBeVisible({ timeout: 10000 });

    const row = (
      await sql`
        select price_eur from barber_service_prices
        where barber_id = ${barberIds[1]} and service_id = ${serviceId}`
    )[0]!;
    expect(Number(row.price_eur)).toBe(9.5);
  });
});
