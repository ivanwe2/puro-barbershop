"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { bookings, barbers, services, timeOff } from "@/db/schema";
import { and, eq, gte, lte, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { sofiaLongDate, sofiaTime, sofiaWallToInstant } from "@/lib/datetime";
import { getAvailableSlots } from "@/lib/booking/availability";
import { generateCancellationToken } from "@/lib/booking/tokens";
import { sendCancellationEmail, sendRescheduleEmail } from "@/lib/email";
import { shop } from "@/lib/shop";
import { env } from "@/lib/env";
import { barberColor } from "@/lib/barber-colors";

const ADDRESS_BG = "Бул. Христо Ботев 114, Пловдив, България";
const ADDRESS_EN = "114 Hristo Botev Blvd, Plovdiv, Bulgaria";

function getBarberColor(id: number): string {
  return barberColor(id).tile;
}

export async function fetchScheduleBookings({
  barberId,
  startDate,
  endDate,
}: {
  barberId?: number;
  startDate: string;
  endDate: string;
}) {
  const session = await auth();
  if (!session) return { error: "unauthorized" } as const;

  // Everyone (barbers included) sees the whole shop calendar. Editing is still
  // restricted per-owner in updateBookingStatus / rescheduleBooking. The
  // optional barberId is just a filter (the "Filter by barber" dropdown).
  const effectiveBarberId = barberId;

  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  const baseWhere = and(gte(bookings.startDatetime, start), lte(bookings.startDatetime, end));

  const select = {
    id: bookings.id,
    barberId: bookings.barberId,
    barberName: barbers.nameBg,
    serviceId: bookings.serviceId,
    serviceName: services.nameBg,
    customerName: bookings.customerName,
    customerEmail: bookings.customerEmail,
    customerPhone: bookings.customerPhone,
    startDatetime: bookings.startDatetime,
    endDatetime: bookings.endDatetime,
    status: bookings.status,
    notes: bookings.notes,
    locale: bookings.locale,
  };

  const whereClause = effectiveBarberId
    ? and(baseWhere, eq(bookings.barberId, effectiveBarberId))
    : baseWhere;

  const rows = await db
    .select(select)
    .from(bookings)
    .leftJoin(services, eq(bookings.serviceId, services.id))
    .leftJoin(barbers, eq(bookings.barberId, barbers.id))
    .where(whereClause)
    .orderBy(asc(bookings.startDatetime));

  return {
    bookings: rows.map((r) => ({
      ...r,
      barberColor: getBarberColor(r.barberId ?? 0),
    })),
  } as const;
}

export async function fetchBarbers() {
  const session = await auth();
  if (!session) return { error: "unauthorized" } as const;

  const rows = await db
    .select({
      id: barbers.id,
      nameBg: barbers.nameBg,
      nameEn: barbers.nameEn,
    })
    .from(barbers)
    .where(eq(barbers.active, true))
    .orderBy(asc(barbers.displayOrder));

  return { barbers: rows } as const;
}

export async function fetchTimeOff({ startDate, endDate }: { startDate: string; endDate: string }) {
  const session = await auth();
  if (!session) return { error: "unauthorized" } as const;

  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  const rows = await db
    .select({
      id: timeOff.id,
      barberId: timeOff.barberId,
      barberName: barbers.nameBg,
      startDatetime: timeOff.startDatetime,
      endDatetime: timeOff.endDatetime,
      reason: timeOff.reason,
    })
    .from(timeOff)
    .leftJoin(barbers, eq(timeOff.barberId, barbers.id))
    .where(and(lte(timeOff.endDatetime, end), gte(timeOff.startDatetime, start)))
    .orderBy(asc(timeOff.startDatetime));

  return { timeOff: rows } as const;
}

export async function fetchServices() {
  const session = await auth();
  if (!session) return { error: "unauthorized" } as const;

  const rows = await db
    .select({ id: services.id, nameBg: services.nameBg, nameEn: services.nameEn })
    .from(services)
    .where(eq(services.active, true))
    .orderBy(asc(services.displayOrder));

  return { services: rows } as const;
}

const walkInSchema = z.object({
  barberId: z.number().int().positive(),
  serviceId: z.number().int().positive(),
  date: z.string().date(),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  customerName: z.string().min(2).max(100),
  customerPhone: z.string().min(7).max(30),
  customerEmail: z.string().email().max(255).optional(),
});

export async function createWalkInBooking(input: unknown) {
  const session = await auth();
  if (!session) return { error: "unauthorized" } as const;

  const parsed = walkInSchema.safeParse(input);
  if (!parsed.success) return { error: "validation_error" } as const;

  const { barberId, serviceId, date, time, customerName, customerPhone, customerEmail } =
    parsed.data;

  const isSuperAdmin = session.user?.role === "super_admin";
  if (!isSuperAdmin && barberId !== session.user?.barberId) {
    return { error: "forbidden" } as const;
  }

  // Server-side slot availability check
  const dateObj = new Date(`${date}T${time}:00+03:00`);
  const slots = await getAvailableSlots({ serviceId, barberId, date: dateObj, db });
  const isAvailable = slots.some((s) => s.toTimeString().slice(0, 5) === time);
  if (!isAvailable) return { error: "slotTaken" } as const;

  const serviceRows = await db
    .select()
    .from(services)
    .where(and(eq(services.id, serviceId), eq(services.active, true)));
  const service = serviceRows[0];
  if (!service) return { error: "notFound" } as const;

  const startDatetime = sofiaWallToInstant(`${date}T${time}`);
  const endDatetime = new Date(startDatetime.getTime() + service.durationMinutes * 60000);
  // Random placeholder token — updated with HMAC after insert
  const placeholderToken = crypto.randomBytes(32).toString("hex");
  const email = customerEmail ?? `walkin-${Date.now()}@internal.local`;

  try {
    const result = await db
      .insert(bookings)
      .values({
        serviceId,
        barberId,
        customerName: customerName.trim(),
        customerEmail: email,
        customerPhone: customerPhone.trim(),
        startDatetime,
        endDatetime,
        status: "confirmed",
        cancellationToken: placeholderToken,
        locale: "bg",
        notes: "[Walk-in]",
      })
      .returning();

    const booking = result[0];
    if (!booking) return { error: "failed" } as const;

    const realToken = generateCancellationToken(booking.id);
    await db
      .update(bookings)
      .set({ cancellationToken: realToken })
      .where(eq(bookings.id, booking.id));

    revalidatePath("/admin/schedule");
    return { success: true, bookingId: booking.id } as const;
  } catch (err) {
    if (err instanceof Error && err.message.includes("duplicate key")) {
      return { error: "slotTaken" } as const;
    }
    return { error: "failed" } as const;
  }
}

export async function updateBookingStatus(
  bookingId: number,
  status: "completed" | "cancelled" | "no_show",
) {
  const session = await auth();
  if (!session) return { error: "unauthorized" } as const;

  const isSuperAdmin = session.user?.role === "super_admin";

  // Fetch the booking (with service name) to check ownership + email on cancel
  const [existing] = await db
    .select({
      barberId: bookings.barberId,
      customerName: bookings.customerName,
      customerEmail: bookings.customerEmail,
      startDatetime: bookings.startDatetime,
      endDatetime: bookings.endDatetime,
      locale: bookings.locale,
      serviceNameBg: services.nameBg,
      serviceNameEn: services.nameEn,
    })
    .from(bookings)
    .leftJoin(services, eq(bookings.serviceId, services.id))
    .where(eq(bookings.id, bookingId));

  if (!existing) return { error: "notFound" } as const;

  // Authorization: barber can only edit their own bookings
  if (!isSuperAdmin && existing.barberId !== session.user?.barberId) {
    return { error: "forbidden" } as const;
  }

  await db
    .update(bookings)
    .set({ status, updatedAt: new Date() })
    .where(eq(bookings.id, bookingId));

  // Notify the customer when an admin cancels (skip internal walk-in emails).
  if (status === "cancelled" && !existing.customerEmail.endsWith("@internal.local")) {
    const isBg = existing.locale === "bg";
    after(async () => {
      await sendCancellationEmail({
        to: existing.customerEmail,
        name: existing.customerName,
        date: sofiaLongDate(existing.startDatetime, isBg ? "bg" : "en"),
        time: sofiaTime(existing.startDatetime),
        serviceName: (isBg ? existing.serviceNameBg : existing.serviceNameEn) ?? "",
        address: isBg
          ? "Бул. Христо Ботев 114, Пловдив, България"
          : "114 Hristo Botev Blvd, Plovdiv, Bulgaria",
        phone: shop.phone,
        locale: isBg ? "bg" : "en",
      });
    });
  }

  revalidatePath("/admin/schedule");

  return { success: true } as const;
}

const rescheduleSchema = z.object({
  date: z.string().date(),
  time: z.string().regex(/^\d{2}:\d{2}$/),
});

export async function rescheduleBooking(bookingId: number, input: unknown) {
  const session = await auth();
  if (!session) return { error: "unauthorized" } as const;

  const parsed = rescheduleSchema.safeParse(input);
  if (!parsed.success) return { error: "validation_error" } as const;
  const { date, time } = parsed.data;

  const isSuperAdmin = session.user?.role === "super_admin";

  const [existing] = await db
    .select({
      barberId: bookings.barberId,
      serviceId: bookings.serviceId,
      customerName: bookings.customerName,
      customerEmail: bookings.customerEmail,
      startDatetime: bookings.startDatetime,
      status: bookings.status,
      locale: bookings.locale,
      cancellationToken: bookings.cancellationToken,
      durationMinutes: services.durationMinutes,
      serviceNameBg: services.nameBg,
      serviceNameEn: services.nameEn,
      barberNameBg: barbers.nameBg,
      barberNameEn: barbers.nameEn,
    })
    .from(bookings)
    .leftJoin(services, eq(bookings.serviceId, services.id))
    .leftJoin(barbers, eq(bookings.barberId, barbers.id))
    .where(eq(bookings.id, bookingId));

  if (!existing || existing.durationMinutes == null) return { error: "notFound" } as const;
  // Barbers may only reschedule their own bookings.
  if (!isSuperAdmin && existing.barberId !== session.user?.barberId) {
    return { error: "forbidden" } as const;
  }
  if (existing.status !== "confirmed") return { error: "notConfirmed" } as const;

  const startDatetime = sofiaWallToInstant(`${date}T${time}`);

  // Unchanged — nothing to do (and don't email the customer).
  if (startDatetime.getTime() === existing.startDatetime.getTime()) {
    return { success: true } as const;
  }

  // The new slot must be free for this barber + service. getAvailableSlots
  // excludes all confirmed bookings, including this one's current slot (which
  // we're leaving), so moving to any other free slot works.
  const slots = await getAvailableSlots({
    serviceId: existing.serviceId,
    barberId: existing.barberId,
    date: startDatetime,
    db,
  });
  const isAvailable = slots.some((s) => s.toTimeString().slice(0, 5) === time);
  if (!isAvailable) return { error: "slotTaken" } as const;

  const endDatetime = new Date(startDatetime.getTime() + existing.durationMinutes * 60000);

  try {
    await db
      .update(bookings)
      .set({ startDatetime, endDatetime, updatedAt: new Date() })
      .where(eq(bookings.id, bookingId));
  } catch (err) {
    if (err instanceof Error && err.message.includes("duplicate key")) {
      return { error: "slotTaken" } as const;
    }
    return { error: "failed" } as const;
  }

  // Notify the customer of the new time (skip internal walk-in placeholders).
  if (!existing.customerEmail.endsWith("@internal.local")) {
    const isBg = existing.locale === "bg";
    after(async () => {
      await sendRescheduleEmail({
        to: existing.customerEmail,
        name: existing.customerName,
        date: sofiaLongDate(startDatetime, isBg ? "bg" : "en"),
        time: sofiaTime(startDatetime),
        serviceName: (isBg ? existing.serviceNameBg : existing.serviceNameEn) ?? "",
        barberName: (isBg ? existing.barberNameBg : existing.barberNameEn) ?? "",
        cancellationLink: `${env.AUTH_URL}/${existing.locale}/book/cancel/${existing.cancellationToken}`,
        address: isBg ? ADDRESS_BG : ADDRESS_EN,
        phone: shop.phone,
        locale: isBg ? "bg" : "en",
      });
    });
  }

  revalidatePath("/admin/schedule");
  return { success: true, startDatetime, endDatetime } as const;
}
