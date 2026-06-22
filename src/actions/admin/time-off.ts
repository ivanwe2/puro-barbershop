"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { timeOff, barbers, bookings } from "@/db/schema";
import { and, eq, gte, lte, asc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const timeOffSchema = z.object({
  barberId: z.number().int().positive(),
  startDatetime: z.string().datetime(),
  endDatetime: z.string().datetime(),
  reason: z.string().max(500).optional(),
});

export async function fetchTimeOffEntries() {
  const session = await auth();
  if (!session) return { error: "unauthorized" } as const;

  const isSuperAdmin = session.user?.role === "super_admin";
  const barberId = isSuperAdmin ? undefined : session.user?.barberId;

  const select = {
    id: timeOff.id,
    barberId: timeOff.barberId,
    barberName: barbers.nameBg,
    startDatetime: timeOff.startDatetime,
    endDatetime: timeOff.endDatetime,
    reason: timeOff.reason,
    createdAt: timeOff.createdAt,
  };

  const whereClause = barberId ? eq(timeOff.barberId, barberId) : undefined;

  const rows = await db
    .select(select)
    .from(timeOff)
    .leftJoin(barbers, eq(timeOff.barberId, barbers.id))
    .where(whereClause)
    .orderBy(asc(timeOff.startDatetime));

  return { entries: rows } as const;
}

export async function createTimeOff(formData: FormData) {
  const session = await auth();
  if (!session) return { error: "unauthorized" } as const;

  const isSuperAdmin = session.user?.role === "super_admin";

  const parsed = timeOffSchema.safeParse({
    barberId: Number(formData.get("barberId")),
    startDatetime: formData.get("startDatetime") as string,
    endDatetime: formData.get("endDatetime") as string,
    reason: formData.get("reason") as string | undefined,
  });

  if (!parsed.success) {
    return { error: "validation", messages: parsed.error.flatten().fieldErrors } as const;
  }

  const { barberId, startDatetime, endDatetime, reason } = parsed.data;

  // Barber can only create for themselves
  if (!isSuperAdmin && barberId !== session.user?.barberId) {
    return { error: "forbidden" } as const;
  }

  // Verify barber exists
  const [barber] = await db
    .select({ id: barbers.id })
    .from(barbers)
    .where(eq(barbers.id, barberId));

  if (!barber) {
    return { error: "barberNotFound" } as const;
  }

  // Check end > start
  if (new Date(endDatetime) <= new Date(startDatetime)) {
    return { error: "endBeforeStart" } as const;
  }

  // Check for overlapping bookings (warn but don't block)
  const overlappingBookings = await db
    .select({
      id: bookings.id,
      customerName: bookings.customerName,
      startDatetime: bookings.startDatetime,
    })
    .from(bookings)
    .where(
      and(
        eq(bookings.barberId, barberId),
        lte(bookings.endDatetime, new Date(endDatetime)),
        gte(bookings.startDatetime, new Date(startDatetime)),
        eq(bookings.status, "confirmed"),
      ),
    )
    .orderBy(asc(bookings.startDatetime));

  const result = await db
    .insert(timeOff)
    .values({
      barberId,
      startDatetime: new Date(startDatetime),
      endDatetime: new Date(endDatetime),
      reason: reason ?? null,
    })
    .returning();

  revalidatePath("/admin/time-off");
  revalidatePath("/admin/schedule");

  if (overlappingBookings.length > 0) {
    return { success: true, id: result[0]?.id, overlappingBookings } as const;
  }

  return { success: true, id: result[0]?.id } as const;
}

export async function updateTimeOff(id: number, formData: FormData) {
  const session = await auth();
  if (!session) return { error: "unauthorized" } as const;

  const isSuperAdmin = session.user?.role === "super_admin";

  // Check ownership
  const [existing] = await db
    .select({ barberId: timeOff.barberId })
    .from(timeOff)
    .where(eq(timeOff.id, id));

  if (!existing) return { error: "notFound" } as const;

  if (!isSuperAdmin && existing.barberId !== session.user?.barberId) {
    return { error: "forbidden" } as const;
  }

  const parsed = timeOffSchema.safeParse({
    barberId: isSuperAdmin ? Number(formData.get("barberId")) : existing.barberId,
    startDatetime: formData.get("startDatetime") as string,
    endDatetime: formData.get("endDatetime") as string,
    reason: formData.get("reason") as string | undefined,
  });

  if (!parsed.success) {
    return { error: "validation", messages: parsed.error.flatten().fieldErrors } as const;
  }

  const { barberId, startDatetime, endDatetime, reason } = parsed.data;

  if (new Date(endDatetime) <= new Date(startDatetime)) {
    return { error: "endBeforeStart" } as const;
  }

  const updateData: Record<string, unknown> = {
    startDatetime: new Date(startDatetime),
    endDatetime: new Date(endDatetime),
    reason: reason ?? null,
  };

  if (isSuperAdmin) {
    updateData.barberId = barberId;
  }

  await db.update(timeOff).set(updateData).where(eq(timeOff.id, id));

  revalidatePath("/admin/time-off");
  revalidatePath("/admin/schedule");

  return { success: true } as const;
}

export async function deleteTimeOff(id: number) {
  const session = await auth();
  if (!session) return { error: "unauthorized" } as const;

  const isSuperAdmin = session.user?.role === "super_admin";

  const [existing] = await db
    .select({ barberId: timeOff.barberId })
    .from(timeOff)
    .where(eq(timeOff.id, id));

  if (!existing) return { error: "notFound" } as const;

  if (!isSuperAdmin && existing.barberId !== session.user?.barberId) {
    return { error: "forbidden" } as const;
  }

  // Check for overlapping bookings
  const [entry] = await db.select().from(timeOff).where(eq(timeOff.id, id));

  const overlappingBookings = entry
    ? await db
        .select({
          id: bookings.id,
          customerName: bookings.customerName,
          startDatetime: bookings.startDatetime,
          status: bookings.status,
        })
        .from(bookings)
        .where(
          and(
            eq(bookings.barberId, existing.barberId),
            lte(bookings.endDatetime, new Date(entry.endDatetime)),
            gte(bookings.startDatetime, new Date(entry.startDatetime)),
          ),
        )
        .orderBy(asc(bookings.startDatetime))
    : [];

  await db.delete(timeOff).where(eq(timeOff.id, id));

  revalidatePath("/admin/time-off");
  revalidatePath("/admin/schedule");

  if (overlappingBookings.length > 0) {
    return { success: true, overlappingBookings } as const;
  }

  return { success: true } as const;
}
