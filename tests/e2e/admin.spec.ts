import { test, expect, type Page, type Locator } from "@playwright/test";
import { sql, login, clearMail, waitForMail, ymd, openDateAhead } from "./helpers";

// Several admin handlers call window.location.reload() after the server action.
// Click the button AND wait for that reload to finish, so later interactions
// don't race the navigation.
async function clickAndReload(page: Page, locator: Locator) {
  const nav = page.waitForNavigation({ waitUntil: "load", timeout: 30000 }).catch(() => {});
  await locator.click();
  await nav;
}

test.describe.configure({ mode: "serial" });
test.beforeEach(async ({ page }) => {
  await login(page);
});

test.afterAll(async () => {
  await sql`delete from bookings where customer_name like 'Walk QA%'`;
  await sql`delete from time_off where reason like 'QA%'`;
  await sql`update barbers set user_id = null where name_en like 'Test QA%'`;
  await sql`delete from users where email like 'qa-%@example.com'`;
  await sql`delete from barbers where name_en like 'Test QA%'`;
});

test("all admin pages render", async ({ page }) => {
  for (const [url, heading] of [
    ["/en/admin", "Dashboard"],
    ["/en/admin/schedule", "Schedule"],
    ["/en/admin/time-off", "Time Off"],
    ["/en/admin/barbers", "Barbers"],
    ["/en/admin/services", "Services"],
    ["/en/admin/settings", "Settings"],
  ] as const) {
    await page.goto(url, { waitUntil: "networkidle" });
    await expect(page.locator("h1").first()).toContainText(heading);
  }
});

test("barber CRUD + invite", async ({ page }) => {
  const tag = "QA" + Date.now();
  const nameEn = "Test " + tag;
  const inviteEmail = `qa-${tag.toLowerCase()}@example.com`;
  const rowFor = () => page.locator("div.rounded-lg.border").filter({ hasText: nameEn }).first();

  await page.goto("/en/admin/barbers", { waitUntil: "networkidle" });

  // Create — the handler reloads the page; wait for the new row to appear.
  await page.getByRole("button", { name: "Create", exact: true }).first().click();
  const create = page.getByRole("dialog");
  await create.locator('input[name="nameBg"]').fill("Тест " + tag);
  await create.locator('input[name="nameEn"]').fill(nameEn);
  await clickAndReload(page, create.getByRole("button", { name: "Create", exact: true }));
  await expect(rowFor()).toBeVisible({ timeout: 20000 });

  const b = (await sql`select id, active from barbers where name_en = ${nameEn}`)[0]!;
  expect(b.active).toBe(true);
  const wh = (
    await sql`select count(*)::int as c from working_hours where barber_id = ${b.id}`
  )[0]!;
  expect(wh.c, "7 default working-hours rows").toBe(7);

  // Toggle inactive — navigate fresh, then edit.
  await page.goto("/en/admin/barbers", { waitUntil: "domcontentloaded" });
  await rowFor().getByRole("button", { name: "Edit" }).click();
  const edit = page.getByRole("dialog");
  await edit.getByRole("checkbox").click();
  await clickAndReload(page, edit.getByRole("button", { name: "Save", exact: true }));
  expect((await sql`select active from barbers where name_en = ${nameEn}`)[0]!.active).toBe(false);

  // Invite — navigate fresh, then open the invite dialog.
  await clearMail();
  await page.goto("/en/admin/barbers", { waitUntil: "domcontentloaded" });
  await rowFor().getByRole("button", { name: "Invite Barber" }).click();
  const invite = page.getByRole("dialog");
  await invite.locator('input[type="email"]').fill(inviteEmail);
  await clickAndReload(page, invite.getByRole("button", { name: "Invite Barber" }));
  await expect
    .poll(async () => (await sql`select id from users where email = ${inviteEmail}`).length, {
      timeout: 20000,
    })
    .toBe(1);
  expect(await waitForMail("Добавени сте към Puro Barbershop", inviteEmail)).not.toBeNull();
  // Unlink so the barber can be deleted cleanly.
  await sql`update barbers set user_id = null where name_en = ${nameEn}`;
  await sql`delete from users where email = ${inviteEmail}`;

  // Delete — navigate fresh, then remove it.
  await page.goto("/en/admin/barbers", { waitUntil: "domcontentloaded" });
  await rowFor().getByRole("button", { name: "Delete" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Delete", exact: true }).click();
  await expect
    .poll(async () => (await sql`select id from barbers where name_en = ${nameEn}`).length, {
      timeout: 20000,
    })
    .toBe(0);
});

test("settings save + restore", async ({ page }) => {
  const [before] = await sql`select value from settings where key = 'buffer_minutes'`;
  const orig = before?.value ?? "15";
  const testVal = orig === "20" ? "25" : "20";

  await page.goto("/en/admin/settings", { waitUntil: "networkidle" });
  const buffer = page.locator('input[type="number"]').first();
  await buffer.fill(testVal);
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect
    .poll(
      async () => (await sql`select value from settings where key='buffer_minutes'`)[0]?.value,
      {
        timeout: 10000,
      },
    )
    .toBe(testVal);

  await buffer.fill(orig);
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect
    .poll(
      async () => (await sql`select value from settings where key='buffer_minutes'`)[0]?.value,
      {
        timeout: 10000,
      },
    )
    .toBe(orig);
});

test("time-off create", async ({ page }) => {
  const reason = "QA" + Date.now();
  await page.goto("/en/admin/time-off", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Add Time Off" }).click();
  const dlg = page.getByRole("dialog");
  await dlg.getByText("Select barber").click();
  await page.getByRole("option", { name: "Сеней" }).first().click();
  const day = ymd(new Date(Date.now() + 3 * 86400000));
  await dlg.locator('input[name="startDatetime"]').fill(day + "T12:00");
  await dlg.locator('input[name="endDatetime"]').fill(day + "T14:00");
  await dlg.locator('textarea[name="reason"], input[name="reason"]').first().fill(reason);
  await dlg.getByRole("button", { name: /Create|Save/ }).click();

  await expect
    .poll(async () => (await sql`select id from time_off where reason = ${reason}`).length, {
      timeout: 15000,
    })
    .toBe(1);
  await sql`delete from time_off where reason = ${reason}`;
});

test("walk-in + week-nav refetch + mark completed", async ({ page }) => {
  const custName = "Walk QA" + Date.now();
  const date = openDateAhead(14);

  await page.goto("/en/admin/schedule", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Add Walk-in/ }).click();
  const dlg = page.getByRole("dialog");
  await dlg.locator('input[type="date"]').fill(date);
  await dlg.locator('input[type="time"]').fill("14:00");
  await dlg.locator('input[placeholder="Customer Name"]').fill(custName);
  await dlg.locator('input[placeholder="+359..."]').fill("+359888123456");
  await dlg.getByRole("button", { name: "Confirm" }).click();

  await expect
    .poll(
      async () =>
        (await sql`select notes from bookings where customer_name = ${custName}`)[0]?.notes,
      {
        timeout: 15000,
      },
    )
    .toBe("[Walk-in]");

  // The booking is 2 weeks out — navigating there must load it (refetch).
  await page.goto("/en/admin/schedule", { waitUntil: "networkidle" });
  let found = false;
  for (let i = 0; i < 4 && !found; i++) {
    if (
      await page
        .getByText(custName)
        .first()
        .isVisible()
        .catch(() => false)
    ) {
      found = true;
      break;
    }
    await page.getByRole("button", { name: "Next →" }).first().click();
    await page.waitForTimeout(1200);
  }
  expect(found, "future-week booking appears after navigation").toBe(true);

  // Reschedule to 15:00 and confirm the stored Sofia time moved.
  await page.getByText(custName).first().click();
  await page.getByRole("button", { name: "Reschedule" }).click();
  const rd = page.getByRole("dialog");
  await rd.locator('input[type="time"]').fill("15:00");
  await rd.getByRole("button", { name: "Confirm" }).click();
  await expect
    .poll(
      async () =>
        (
          await sql`select to_char(start_datetime at time zone 'Europe/Sofia','HH24:MI') as hm from bookings where customer_name = ${custName}`
        )[0]?.hm,
      { timeout: 15000 },
    )
    .toBe("15:00");

  // Mark completed.
  await page.getByText(custName).first().click();
  await page.getByRole("button", { name: "Mark as Completed" }).click();
  await page.getByRole("button", { name: "Confirm", exact: true }).last().click();
  await expect
    .poll(
      async () =>
        (await sql`select status from bookings where customer_name = ${custName}`)[0]?.status,
      {
        timeout: 15000,
      },
    )
    .toBe("completed");

  await sql`delete from bookings where customer_name = ${custName}`;
});
