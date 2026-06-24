import "dotenv/config";
import bcrypt from "bcryptjs";
import pg from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import * as schema from "../src/db/schema";

const DB_URL = process.env.DATABASE_URL || process.env.DATABASE_URL_UNPOOLED;

if (!DB_URL) {
  console.error("ERROR: DATABASE_URL or DATABASE_URL_UNPOOLED is not set.");
  process.exit(1);
}

const seedPassword = process.env.SEED_ADMIN_PASSWORD;

if (!seedPassword || seedPassword.length < 16) {
  console.error("ERROR: SEED_ADMIN_PASSWORD must be set and at least 16 characters long.");
  process.exit(1);
}

async function main() {
  const client = pg(DB_URL as string);
  const db = drizzle(client, { schema });

  const existing = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.email, "admin@purobarbershop.com"))
    .limit(1);

  if (existing.length > 0) {
    console.log("Already seeded — skipping.");
    await client.end();
    return;
  }

  console.log("Seeding database...");

  // 1. Super admin user
  const passwordHash = await bcrypt.hash(seedPassword as string, 12);
  const [adminUser] = await db
    .insert(schema.users)
    .values({
      email: "admin@purobarbershop.com",
      passwordHash,
      role: "super_admin",
    })
    .returning();

  if (!adminUser) {
    console.error("ERROR: Failed to create admin user.");
    await client.end();
    process.exit(1);
  }

  console.log(`  Created super admin: ${adminUser.email}`);

  // TODO(human): Change the admin password on first login. The seeded password
  // is only for initial setup and should not remain in production.

  // 2. Placeholder barbers
  const [barber1] = await db
    .insert(schema.barbers)
    .values({
      nameEn: "[PLACEHOLDER:barber_1_name]",
      nameBg: "[PLACEHOLDER:barber_1_name]",
      displayOrder: 1,
      active: true,
      userId: adminUser.id,
    })
    .returning();

  if (!barber1) {
    console.error("ERROR: Failed to create barber 1.");
    await client.end();
    process.exit(1);
  }

  console.log(`  Created barber 1: ${barber1.nameEn}`);

  const [barber2] = await db
    .insert(schema.barbers)
    .values({
      nameEn: "[PLACEHOLDER:barber_2_name]",
      nameBg: "[PLACEHOLDER:barber_2_name]",
      displayOrder: 2,
      active: true,
    })
    .returning();

  if (!barber2) {
    console.error("ERROR: Failed to create barber 2.");
    await client.end();
    process.exit(1);
  }

  console.log(`  Created barber 2: ${barber2.nameEn}`);

  // 3. Services
  // TODO(human): Replace 0.00 with actual prices before launch.
  const services = [
    {
      nameEn: "Haircut",
      nameBg: "Подстрижка",
      durationMinutes: 30,
      priceBgn: "0.00", // [PLACEHOLDER:price]
      displayOrder: 1,
    },
    {
      nameEn: "Haircut + Beard",
      nameBg: "Подстрижка + Брада",
      durationMinutes: 45,
      priceBgn: "0.00", // [PLACEHOLDER:price]
      displayOrder: 2,
    },
    {
      nameEn: "Beard trim",
      nameBg: "Оформяне на брада",
      durationMinutes: 20,
      priceBgn: "0.00", // [PLACEHOLDER:price]
      displayOrder: 3,
    },
    {
      nameEn: "Kids haircut",
      nameBg: "Детска подстрижка",
      durationMinutes: 30,
      priceBgn: "0.00", // [PLACEHOLDER:price]
      displayOrder: 4,
    },
  ];

  for (const s of services) {
    await db.insert(schema.services).values(s);
    console.log(`  Created service: ${s.nameEn}`);
  }

  // 4. Working hours: every day 10:00-19:30
  const barberIds = [barber1.id, barber2.id];
  const hours = [
    { dayOfWeek: 0, startTime: "10:00", endTime: "19:30" }, // Sun
    { dayOfWeek: 1, startTime: "10:00", endTime: "19:30" }, // Mon
    { dayOfWeek: 2, startTime: "10:00", endTime: "19:30" }, // Tue
    { dayOfWeek: 3, startTime: "10:00", endTime: "19:30" }, // Wed
    { dayOfWeek: 4, startTime: "10:00", endTime: "19:30" }, // Thu
    { dayOfWeek: 5, startTime: "10:00", endTime: "19:30" }, // Fri
    { dayOfWeek: 6, startTime: "10:00", endTime: "19:30" }, // Sat
  ];

  for (const barberId of barberIds) {
    for (const h of hours) {
      await db.insert(schema.workingHours).values({
        barberId,
        dayOfWeek: h.dayOfWeek,
        startTime: h.startTime,
        endTime: h.endTime,
        active: true,
      });
    }
    console.log(`  Set working hours for barber ${barberId}`);
  }

  // 5. Settings
  const settingsData = [
    { key: "buffer_minutes", value: "15" },
    { key: "cancellation_window_hours", value: "24" },
    { key: "booking_horizon_days", value: "60" },
    { key: "slot_granularity_minutes", value: "15" },
  ];

  for (const s of settingsData) {
    await db.insert(schema.settings).values(s);
    console.log(`  Set ${s.key} = ${s.value}`);
  }

  await client.end();
  console.log("\nSeed complete!");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
