import { eq, and, gte, lte, or, asc } from "drizzle-orm";

import { barbers, bookings, services, settings, timeOff, workingHours } from "@/db/schema";

const SOFIA_TZ = "Europe/Sofia";

import type { DB } from "@/db";

interface GetAvailableSlotsArgs {
  serviceId: number;
  barberId: number;
  date: Date;
  db: DB;
}

interface GetAvailableSlotsForAnyBarberArgs {
  serviceId: number;
  date: Date;
  db: DB;
}

interface SlotResult {
  slot: Date;
  availableBarberIds: number[];
}

function getSofiaOffsetMs(date: Date): number {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: SOFIA_TZ,
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const hour = parseInt(parts.find((p) => p.type === "hour")!.value, 10);
  const minute = parseInt(parts.find((p) => p.type === "minute")!.value, 10);
  const second = parseInt(parts.find((p) => p.type === "second")!.value, 10);
  const utcMs =
    date.getUTCFullYear() * 0 +
    date.getUTCHours() * 3600000 +
    date.getUTCMinutes() * 60000 +
    date.getUTCSeconds() * 1000;
  const sofiaMs = hour * 3600000 + minute * 60000 + second * 1000;
  return sofiaMs - utcMs;
}

function getNowInSofia(): Date {
  return new Date(Date.now() + getSofiaOffsetMs(new Date()));
}

function getSofiaMidnight(date: Date): Date {
  const offset = getSofiaOffsetMs(date);
  const utcDate = new Date(date.getTime() + offset);
  return new Date(Date.UTC(utcDate.getUTCFullYear(), utcDate.getUTCMonth(), utcDate.getUTCDate()));
}

function getDayOfWeekSofia(date: Date): number {
  const mid = getSofiaMidnight(date);
  return mid.getUTCDay();
}

function timeStrToMinutes(timeStr: string | null): number | null {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(":").map(Number);
  if (h == null || m == null) return null;
  return h * 60 + m;
}

async function getSettingValue(db: DB, key: string): Promise<string> {
  const rows = await db.select().from(settings).where(eq(settings.key, key));
  const row = rows.find((r) => r.key === key);
  if (!row) throw new Error(`Setting not found: ${key}`);
  return row.value;
}

async function getAvailableSlots({
  serviceId,
  barberId,
  date,
  db,
}: GetAvailableSlotsArgs): Promise<Date[]> {
  if (!Number.isInteger(serviceId) || serviceId <= 0) return [];
  if (!Number.isInteger(barberId) || barberId <= 0) return [];

  const now = getNowInSofia();

  const sofiaMidnight = getSofiaMidnight(date);
  const sofiaEndOfDay = new Date(sofiaMidnight.getTime() + 86400000);

  const horizonDays = parseInt(await getSettingValue(db, "booking_horizon_days"), 10);
  const horizonEnd = new Date(now.getTime() + horizonDays * 86400000);

  if (sofiaEndOfDay <= now || sofiaMidnight > horizonEnd) return [];

  const barberRows = await db
    .select()
    .from(barbers)
    .where(and(eq(barbers.id, barberId), eq(barbers.active, true)));
  const barber = barberRows.find((b) => b.id === barberId && b.active === true);
  if (!barber) return [];

  const serviceRows = await db
    .select()
    .from(services)
    .where(and(eq(services.id, serviceId), eq(services.active, true)));
  const service = serviceRows.find((s) => s.id === serviceId && s.active === true);
  if (!service) return [];

  const durationMinutes = service.durationMinutes;
  const bufferMinutes = parseInt(await getSettingValue(db, "buffer_minutes"), 10);
  const granularityMinutes = parseInt(await getSettingValue(db, "slot_granularity_minutes"), 10);

  const dayOfWeek = getDayOfWeekSofia(sofiaMidnight);

  const hoursRows = await db
    .select()
    .from(workingHours)
    .where(
      and(
        eq(workingHours.barberId, barberId),
        eq(workingHours.dayOfWeek, dayOfWeek),
        eq(workingHours.active, true),
      ),
    );
  const hour = hoursRows.find(
    (h) => h.barberId === barberId && h.dayOfWeek === dayOfWeek && h.active === true,
  );
  if (!hour) return [];

  const startMinutes = timeStrToMinutes(hour.startTime);
  const endMinutes = timeStrToMinutes(hour.endTime);
  if (startMinutes === null || endMinutes === null) return [];

  const timeOffRows = await db
    .select()
    .from(timeOff)
    .where(
      and(
        eq(timeOff.barberId, barberId),
        lte(timeOff.endDatetime, sofiaEndOfDay),
        gte(timeOff.startDatetime, sofiaMidnight),
      ),
    );

  const bookingRows = await db
    .select()
    .from(bookings)
    .where(
      and(
        eq(bookings.barberId, barberId),
        lte(bookings.endDatetime, sofiaEndOfDay),
        gte(bookings.startDatetime, sofiaMidnight),
        or(eq(bookings.status, "confirmed"), eq(bookings.status, "completed")),
      ),
    );

  const occupiedIntervals: Array<{ start: number; end: number }> = [];

  for (const to of timeOffRows.filter(
    (t) =>
      t.barberId === barberId && t.endDatetime <= sofiaEndOfDay && t.startDatetime >= sofiaMidnight,
  )) {
    occupiedIntervals.push({
      start: to.startDatetime.getTime(),
      end: to.endDatetime.getTime(),
    });
  }

  for (const b of bookingRows.filter(
    (bk) =>
      bk.barberId === barberId &&
      bk.endDatetime <= sofiaEndOfDay &&
      bk.startDatetime >= sofiaMidnight &&
      (bk.status === "confirmed" || bk.status === "completed"),
  )) {
    occupiedIntervals.push({
      start: b.startDatetime.getTime(),
      end: b.endDatetime.getTime() + bufferMinutes * 60000,
    });
  }

  const totalSlotMinutes = durationMinutes + bufferMinutes;

  const slots: Date[] = [];
  let currentMinutes = startMinutes;

  while (currentMinutes + totalSlotMinutes <= endMinutes) {
    const slotStartMs = sofiaMidnight.getTime() + currentMinutes * 60000;
    const slotEndMs = slotStartMs + durationMinutes * 60000;
    const slotDate = new Date(slotStartMs);

    if (slotDate > now && slotDate <= horizonEnd) {
      const isOccupied = occupiedIntervals.some(
        (iv) => slotStartMs < iv.end && slotEndMs > iv.start,
      );
      if (!isOccupied) {
        slots.push(slotDate);
      }
    }

    currentMinutes += granularityMinutes;
  }

  return slots;
}

async function getAvailableSlotsForAnyBarber({
  serviceId,
  date,
  db,
}: GetAvailableSlotsForAnyBarberArgs): Promise<SlotResult[]> {
  if (!Number.isInteger(serviceId) || serviceId <= 0) return [];

  const serviceRows = await db
    .select()
    .from(services)
    .where(and(eq(services.id, serviceId), eq(services.active, true)));
  const service = serviceRows.find((s) => s.id === serviceId && s.active === true);
  if (!service) return [];

  const barberRows = await db
    .select()
    .from(barbers)
    .where(eq(barbers.active, true))
    .orderBy(asc(barbers.displayOrder));
  const activeBarbers = barberRows.filter((b) => b.active === true);
  if (activeBarbers.length === 0) return [];

  const barberIdMap = new Map<number, Date[]>();

  for (const barber of activeBarbers) {
    const slots = await getAvailableSlots({
      serviceId,
      barberId: barber.id,
      date,
      db,
    });
    if (slots.length > 0) {
      barberIdMap.set(barber.id, slots);
    }
  }

  const allSlots = new Set(
    Array.from(barberIdMap.values())
      .flat()
      .map((s) => s.getTime()),
  );
  const result: SlotResult[] = [];

  for (const slotMs of allSlots) {
    const slot = new Date(slotMs);
    const availableBarberIds: number[] = [];

    for (const [barberId, barberSlots] of barberIdMap) {
      if (barberSlots.some((s) => s.getTime() === slotMs)) {
        availableBarberIds.push(barberId);
      }
    }

    result.push({ slot, availableBarberIds });
  }

  result.sort((a, b) => a.slot.getTime() - b.slot.getTime());
  return result;
}

export { getAvailableSlots, getAvailableSlotsForAnyBarber };
export type { SlotResult };
