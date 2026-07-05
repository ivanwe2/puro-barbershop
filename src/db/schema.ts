import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  boolean,
  uniqueIndex,
  pgEnum,
  varchar,
  decimal,
  time,
  smallint,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const userRole = pgEnum("user_role", ["super_admin", "barber"]);
export const bookingStatus = pgEnum("booking_status", [
  "confirmed",
  "cancelled",
  "completed",
  "no_show",
]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRole("role").notNull(),
  // Brute-force lockout: consecutive failed logins, and a timestamp until
  // which the account is locked (null = not locked).
  failedLoginAttempts: integer("failed_login_attempts").default(0).notNull(),
  lockedUntil: timestamp("locked_until", { withTimezone: true }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const barbers = pgTable("barbers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  nameEn: varchar("name_en", { length: 100 }).notNull(),
  nameBg: varchar("name_bg", { length: 100 }).notNull(),
  bioEn: text("bio_en"),
  bioBg: text("bio_bg"),
  photoUrl: text("photo_url"),
  displayOrder: integer("display_order").default(0).notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  nameEn: varchar("name_en", { length: 100 }).notNull(),
  nameBg: varchar("name_bg", { length: 100 }).notNull(),
  descriptionEn: text("description_en"),
  descriptionBg: text("description_bg"),
  durationMinutes: integer("duration_minutes").notNull(),
  priceBgn: decimal("price_bgn", { precision: 10, scale: 2 }).notNull(),
  displayOrder: integer("display_order").default(0).notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Per-barber price overrides for a service. Services are shared across barbers,
// but each barber may charge a different price. When no row exists for a
// (barber, service) pair, the shared services.priceBgn base price applies.
// Prices are in EUR (see src/lib/currency.ts).
export const barberServicePrices = pgTable(
  "barber_service_prices",
  {
    id: serial("id").primaryKey(),
    barberId: integer("barber_id")
      .references(() => barbers.id, { onDelete: "cascade" })
      .notNull(),
    serviceId: integer("service_id")
      .references(() => services.id, { onDelete: "cascade" })
      .notNull(),
    priceEur: decimal("price_eur", { precision: 10, scale: 2 }).notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    barberServiceUnique: uniqueIndex("barber_service_unique").on(table.barberId, table.serviceId),
  }),
);

export const workingHours = pgTable("working_hours", {
  id: serial("id").primaryKey(),
  barberId: integer("barber_id")
    .references(() => barbers.id, { onDelete: "cascade" })
    .notNull(),
  dayOfWeek: smallint("day_of_week").notNull(), // 0=Sunday, 6=Saturday
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  active: boolean("active").default(true).notNull(),
});

export const timeOff = pgTable("time_off", {
  id: serial("id").primaryKey(),
  barberId: integer("barber_id")
    .references(() => barbers.id, { onDelete: "cascade" })
    .notNull(),
  startDatetime: timestamp("start_datetime", { withTimezone: true }).notNull(),
  endDatetime: timestamp("end_datetime", { withTimezone: true }).notNull(),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const bookings = pgTable(
  "bookings",
  {
    id: serial("id").primaryKey(),
    serviceId: integer("service_id")
      .references(() => services.id)
      .notNull(),
    barberId: integer("barber_id")
      .references(() => barbers.id)
      .notNull(),
    customerName: varchar("customer_name", { length: 100 }).notNull(),
    customerEmail: varchar("customer_email", { length: 255 }).notNull(),
    customerPhone: varchar("customer_phone", { length: 30 }).notNull(),
    startDatetime: timestamp("start_datetime", { withTimezone: true }).notNull(),
    endDatetime: timestamp("end_datetime", { withTimezone: true }).notNull(),
    status: bookingStatus("status").default("confirmed").notNull(),
    cancellationToken: varchar("cancellation_token", { length: 64 }).notNull().unique(),
    locale: varchar("locale", { length: 5 }).default("bg").notNull(),
    notes: text("notes"),
    reminderSent: boolean("reminder_sent").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    barberSlotUnique: uniqueIndex("barber_slot_unique")
      .on(table.barberId, table.startDatetime)
      .where(sql`status = 'confirmed'`),
  }),
);

export const settings = pgTable("settings", {
  key: varchar("key", { length: 100 }).primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const emailBlacklist = pgTable("email_blacklist", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
