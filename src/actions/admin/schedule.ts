"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { bookings, barbers, services, timeOff } from "@/db/schema";
import { and, eq, gte, lte, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { format } from "date-fns";
import { getAvailableSlots } from "@/lib/booking/availability";
import { generateCancellationToken } from "@/lib/booking/tokens";
import { sendCancellationEmail } from "@/lib/email";

const barberColors: Record<number, string> = {
  1: "bg-blue-500/20 border-blue-500/40 text-blue-300",
  2: "bg-amber-500/20 border-amber-500/40 text-amber-300",
  3: "bg-emerald-500/20 border-emerald-500/40 text-emerald-300",
  4: "bg-purple-500/20 border-purple-500/40 text-purple-300",
  5: "bg-rose-500/20 border-rose-500/40 text-rose-300",
};

function getBarberColor(id: number): string {
  return barberColors[id] ?? "bg-gray-500/20 border-gray-500/40 text-gray-300";
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

  const isSuperAdmin = session.user?.role === "super_admin";
  const effectiveBarberId = isSuperAdmin ? barberId : session.user?.barberId;

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

  const startDatetime = new Date(`${date}T${time}:00+03:00`);
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
        date: format(existing.startDatetime, "EEEE, MMMM d, yyyy"),
        time: format(existing.startDatetime, "HH:mm"),
        serviceName: (isBg ? existing.serviceNameBg : existing.serviceNameEn) ?? "",
        address: isBg
          ? "Бул. Христо Ботев 114, Пловдив, България"
          : "114 Hristo Botev Blvd, Plovdiv, Bulgaria",
        phone: process.env.NEXT_PUBLIC_SHOP_PHONE ?? "",
      });
    });
  }

  revalidatePath("/admin/schedule");

  return { success: true } as const;
}
