"use server";

import { eq, asc, and } from "drizzle-orm";
import { db } from "@/db";
import { getAvailableSlots, getAvailableSlotsForAnyBarber } from "@/lib/booking/availability";
import { getSlotsSchema, bookingDetailsSchema } from "@/lib/booking/schema";
import { barbers, services, bookings, emailBlacklist } from "@/db/schema";
import { generateCancellationToken } from "@/lib/booking/tokens";
import { rateLimiters } from "@/lib/rate-limit";
import { headers } from "next/headers";
import type { InferSelectModel } from "drizzle-orm";

type ServiceRow = InferSelectModel<typeof services>;
type BarberRow = InferSelectModel<typeof barbers>;

type FetchSlotsResult = { slots: string[] } | { error: string };

type FetchServicesResult = { services: ServiceRow[] } | { error: string };

type FetchBarbersResult = { barbers: BarberRow[] } | { error: string };

type CreateBookingResult = { success: true; bookingId: number } | { success: false; error: string };

async function getClientIp(): Promise<string> {
  const headerList = await headers();
  const forwarded = headerList.get("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded.split(",");
    return parts[0]?.trim() ?? "unknown";
  }
  return "unknown";
}

export async function fetchSlots(input: unknown): Promise<FetchSlotsResult> {
  const parsed = getSlotsSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Invalid input" };
  }

  const { serviceId, barberId, date } = parsed.data;

  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return { error: "Invalid date" };
    }

    let slots: string[];

    if (barberId === "any") {
      const results = await getAvailableSlotsForAnyBarber({
        serviceId,
        date: dateObj,
        db,
      });
      slots = results.map((r) => r.slot.toTimeString().slice(0, 5));
    } else {
      const result = await getAvailableSlots({
        serviceId,
        barberId,
        date: dateObj,
        db,
      });
      slots = result.map((s) => s.toTimeString().slice(0, 5));
    }

    return { slots };
  } catch {
    return { error: "Failed to fetch slots" };
  }
}

export async function fetchServices(): Promise<FetchServicesResult> {
  try {
    const rows = await db
      .select()
      .from(services)
      .where(eq(services.active, true))
      .orderBy(asc(services.displayOrder));
    return { services: rows };
  } catch {
    return { error: "Failed to fetch services" };
  }
}

export async function fetchBarbers(): Promise<FetchBarbersResult> {
  try {
    const rows = await db
      .select()
      .from(barbers)
      .where(eq(barbers.active, true))
      .orderBy(asc(barbers.displayOrder));
    return { barbers: rows };
  } catch {
    return { error: "Failed to fetch barbers" };
  }
}

export async function createBooking(input: unknown): Promise<CreateBookingResult> {
  const parsed = bookingDetailsSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "validation_error" };
  }

  const { serviceId, barberId, date, time, name, email, phone, notes, locale } = parsed.data;

  // Sanitize
  const sanitizedEmail = email.trim().toLowerCase();
  const sanitizedName = name.trim();
  const sanitizedPhone = phone.trim();

  // Check email blacklist
  try {
    const blacklisted = await db
      .select({ id: emailBlacklist.id })
      .from(emailBlacklist)
      .where(eq(emailBlacklist.email, sanitizedEmail));

    if (blacklisted.length > 0) {
      return { success: false, error: "booking_error" };
    }
  } catch {
    // If blacklist check fails, proceed — don't block legitimate bookings
  }

  // Rate limiting
  const clientIp = await getClientIp();

  const ipCheck = await rateLimiters.ip.limit(`ip:${clientIp}`);
  if (!ipCheck.success) {
    return { success: false, error: "tooManyRequests" };
  }

  const emailCheck = await rateLimiters.email.limit(`email:${sanitizedEmail}`);
  if (!emailCheck.success) {
    return { success: false, error: "tooManyRequests" };
  }

  const phoneCheck = await rateLimiters.phone.limit(`phone:${sanitizedPhone}`);
  if (!phoneCheck.success) {
    return { success: false, error: "tooManyRequests" };
  }

  // Resolve barber if "any"
  let resolvedBarberId: number;

  if (barberId === "any") {
    try {
      const dateObj = new Date(`${date}T${time}:00+03:00`);
      const results = await getAvailableSlotsForAnyBarber({
        serviceId,
        date: dateObj,
        db,
      });

      const matchingSlot = results.find((r) => r.slot.toTimeString().slice(0, 5) === time);

      if (!matchingSlot || matchingSlot.availableBarberIds.length === 0) {
        return { success: false, error: "slotTaken" };
      }

      const firstBarber = matchingSlot.availableBarberIds[0];
      if (firstBarber == null) {
        return { success: false, error: "slotTaken" };
      }
      resolvedBarberId = firstBarber;
    } catch {
      return { success: false, error: "booking_error" };
    }
  } else {
    resolvedBarberId = barberId;
  }

  // Server-side re-check: is the slot still available?
  try {
    const dateObj = new Date(`${date}T${time}:00+03:00`);
    const slots = await getAvailableSlots({
      serviceId,
      barberId: resolvedBarberId,
      date: dateObj,
      db,
    });

    const isAvailable = slots.some((s) => s.toTimeString().slice(0, 5) === time);

    if (!isAvailable) {
      return { success: false, error: "slotTaken" };
    }
  } catch {
    return { success: false, error: "booking_error" };
  }

  // Get service duration
  const serviceRows = await db
    .select()
    .from(services)
    .where(and(eq(services.id, serviceId), eq(services.active, true)));
  const service = serviceRows.find((s) => s.id === serviceId);

  if (!service) {
    return { success: false, error: "booking_error" };
  }

  // Compute start/end datetime in Sofia timezone
  const startDatetime = new Date(`${date}T${time}:00+03:00`);
  const endDatetime = new Date(startDatetime.getTime() + service.durationMinutes * 60000);

  // Generate cancellation token
  const cancellationToken = generateCancellationToken(0);

  // Insert booking
  try {
    const result = await db
      .insert(bookings)
      .values({
        serviceId,
        barberId: resolvedBarberId,
        customerName: sanitizedName,
        customerEmail: sanitizedEmail,
        customerPhone: sanitizedPhone,
        startDatetime,
        endDatetime,
        status: "confirmed",
        cancellationToken,
        locale,
        notes: notes ?? null,
      })
      .returning();

    if (result.length === 0) {
      return { success: false, error: "slotTaken" };
    }

    const first = result[0];
    if (!first) {
      return { success: false, error: "slotTaken" };
    }

    const bookingId = first.id;

    // Regenerate token with actual booking ID
    const realToken = generateCancellationToken(bookingId);
    await db
      .update(bookings)
      .set({ cancellationToken: realToken })
      .where(eq(bookings.id, bookingId));

    // Trigger emails asynchronously (don't block response)
    // TODO(human): Wire up confirmation + barber notification emails (Commit 12)

    return { success: true, bookingId };
  } catch (err) {
    if (err instanceof Error && err.message.includes("duplicate key")) {
      return { success: false, error: "slotTaken" };
    }
    return { success: false, error: "booking_error" };
  }
}
