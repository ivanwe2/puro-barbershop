"use server";

import { eq, asc } from "drizzle-orm";
import { db } from "@/db";
import { getAvailableSlots, getAvailableSlotsForAnyBarber } from "@/lib/booking/availability";
import { getSlotsSchema } from "@/lib/booking/schema";
import { barbers, services } from "@/db/schema";
import type { InferSelectModel } from "drizzle-orm";

type ServiceRow = InferSelectModel<typeof services>;
type BarberRow = InferSelectModel<typeof barbers>;

type FetchSlotsResult = { slots: string[] } | { error: string };

type FetchServicesResult = { services: ServiceRow[] } | { error: string };

type FetchBarbersResult = { barbers: BarberRow[] } | { error: string };

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
