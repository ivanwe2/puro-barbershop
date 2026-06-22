"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { bookings, barbers, services, timeOff } from "@/db/schema";
import { and, eq, gte, lte, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

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

export async function updateBookingStatus(
  bookingId: number,
  status: "completed" | "cancelled" | "no_show",
) {
  const session = await auth();
  if (!session) return { error: "unauthorized" } as const;

  const isSuperAdmin = session.user?.role === "super_admin";

  // Fetch the booking to check ownership
  const [existing] = await db
    .select({ barberId: bookings.barberId })
    .from(bookings)
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

  revalidatePath("/admin/schedule");

  return { success: true } as const;
}
