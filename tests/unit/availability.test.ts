import { describe, it, expect, beforeEach } from "vitest";
import {
  getAvailableSlots,
  getAvailableSlotsForAnyBarber,
  type SlotResult,
} from "@/lib/booking/availability";
import type { DB } from "@/db";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

function createMockDB(fromMap: Record<string, Row[]>) {
  let currentTable = "";

  return {
    select() {
      return {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        from(table: any) {
          currentTable =
            (table[Symbol.for("drizzle:Name")] as string | undefined) ??
            (table.tableName as string | undefined) ??
            "unknown";
          return {
            where() {
              return {
                orderBy() {
                  return {
                    then(resolve: (v: Row[]) => void) {
                      resolve([...(fromMap[currentTable] ?? [])]);
                    },
                    catch() {},
                  };
                },
                then(resolve: (v: Row[]) => void) {
                  resolve([...(fromMap[currentTable] ?? [])]);
                },
                catch() {},
              };
            },
            then(resolve: (v: Row[]) => void) {
              resolve([...(fromMap[currentTable] ?? [])]);
            },
            catch() {},
          };
        },
      };
    },
  } as unknown as DB;
}

describe("availability engine", () => {
  let db: DB;
  let fromMap: Record<string, Row[]>;

  beforeEach(() => {
    fromMap = {
      barbers: [],
      services: [],
      settings: [],
      working_hours: [],
      time_off: [],
      bookings: [],
    };
    db = createMockDB(fromMap);
  });

  it("returns empty array for invalid serviceId", async () => {
    const slots = await getAvailableSlots({
      serviceId: -1,
      barberId: 1,
      date: new Date(Date.UTC(2026, 6, 1)),
      db,
    });
    expect(slots).toEqual([]);
  });

  it("returns empty array for invalid barberId", async () => {
    const slots = await getAvailableSlots({
      serviceId: 1,
      barberId: 0,
      date: new Date(Date.UTC(2026, 6, 1)),
      db,
    });
    expect(slots).toEqual([]);
  });

  it("returns empty array when barber is not active", async () => {
    fromMap.barbers = [{ id: 1, active: false }];
    fromMap.services = [{ id: 1, active: true, durationMinutes: 30 }];
    fromMap.settings = [
      { key: "buffer_minutes", value: "15" },
      { key: "slot_granularity_minutes", value: "15" },
      { key: "booking_horizon_days", value: "60" },
    ];
    fromMap.working_hours = [
      { barberId: 1, dayOfWeek: 3, startTime: "09:00:00", endTime: "19:00:00", active: true },
    ];

    const slots = await getAvailableSlots({
      serviceId: 1,
      barberId: 1,
      date: new Date(Date.UTC(2026, 6, 1)),
      db,
    });
    expect(slots).toEqual([]);
  });

  it("returns empty array when no working hours for the day", async () => {
    fromMap.barbers = [{ id: 1, active: true }];
    fromMap.services = [{ id: 1, active: true, durationMinutes: 30 }];
    fromMap.settings = [
      { key: "buffer_minutes", value: "15" },
      { key: "slot_granularity_minutes", value: "15" },
      { key: "booking_horizon_days", value: "60" },
    ];

    const slots = await getAvailableSlots({
      serviceId: 1,
      barberId: 1,
      date: new Date(Date.UTC(2026, 6, 1)),
      db,
    });
    expect(slots).toEqual([]);
  });

  it("returns slots for a simple schedule with no bookings or time off", async () => {
    fromMap.barbers = [{ id: 1, active: true }];
    fromMap.services = [{ id: 1, active: true, durationMinutes: 30 }];
    fromMap.settings = [
      { key: "buffer_minutes", value: "15" },
      { key: "slot_granularity_minutes", value: "15" },
      { key: "booking_horizon_days", value: "60" },
    ];
    fromMap.working_hours = [
      { barberId: 1, dayOfWeek: 3, startTime: "09:00:00", endTime: "19:00:00", active: true },
    ];

    const wednesday = new Date(Date.UTC(2026, 6, 1));
    const slots = await getAvailableSlots({
      serviceId: 1,
      barberId: 1,
      date: wednesday,
      db,
    });

    expect(slots.length).toBeGreaterThan(0);
    const firstSlot = slots[0];
    if (!firstSlot) throw new Error("Expected at least one slot");
    expect(firstSlot.getUTCHours()).toBe(9);
    expect(firstSlot.getUTCMinutes()).toBe(0);
  });

  it("respects existing bookings and buffer", async () => {
    fromMap.barbers = [{ id: 1, active: true }];
    fromMap.services = [{ id: 1, active: true, durationMinutes: 30 }];
    fromMap.settings = [
      { key: "buffer_minutes", value: "15" },
      { key: "slot_granularity_minutes", value: "15" },
      { key: "booking_horizon_days", value: "60" },
    ];
    fromMap.working_hours = [
      { barberId: 1, dayOfWeek: 3, startTime: "09:00:00", endTime: "19:00:00", active: true },
    ];
    fromMap.bookings = [
      {
        barberId: 1,
        startDatetime: new Date(Date.UTC(2026, 6, 1, 10, 0, 0)),
        endDatetime: new Date(Date.UTC(2026, 6, 1, 10, 30, 0)),
        status: "confirmed",
      },
    ];

    const wednesday = new Date(Date.UTC(2026, 6, 1));
    const slots = await getAvailableSlots({
      serviceId: 1,
      barberId: 1,
      date: wednesday,
      db,
    });

    const has1000Slot = slots.some((s) => s.getUTCHours() === 10 && s.getUTCMinutes() === 0);
    expect(has1000Slot).toBe(false);

    const has0900Slot = slots.some((s) => s.getUTCHours() === 9 && s.getUTCMinutes() === 0);
    expect(has0900Slot).toBe(true);
  });

  it("respects time off periods", async () => {
    fromMap.barbers = [{ id: 1, active: true }];
    fromMap.services = [{ id: 1, active: true, durationMinutes: 30 }];
    fromMap.settings = [
      { key: "buffer_minutes", value: "15" },
      { key: "slot_granularity_minutes", value: "15" },
      { key: "booking_horizon_days", value: "60" },
    ];
    fromMap.working_hours = [
      { barberId: 1, dayOfWeek: 3, startTime: "09:00:00", endTime: "19:00:00", active: true },
    ];
    fromMap.time_off = [
      {
        barberId: 1,
        startDatetime: new Date(Date.UTC(2026, 6, 1, 12, 0, 0)),
        endDatetime: new Date(Date.UTC(2026, 6, 1, 14, 0, 0)),
      },
    ];

    const wednesday = new Date(Date.UTC(2026, 6, 1));
    const slots = await getAvailableSlots({
      serviceId: 1,
      barberId: 1,
      date: wednesday,
      db,
    });

    const has1230Slot = slots.some((s) => s.getUTCHours() === 12 && s.getUTCMinutes() === 30);
    expect(has1230Slot).toBe(false);

    const has1100Slot = slots.some((s) => s.getUTCHours() === 11 && s.getUTCMinutes() === 0);
    expect(has1100Slot).toBe(true);
  });

  it("returns empty array for past dates", async () => {
    fromMap.barbers = [{ id: 1, active: true }];
    fromMap.services = [{ id: 1, active: true, durationMinutes: 30 }];
    fromMap.settings = [
      { key: "buffer_minutes", value: "15" },
      { key: "slot_granularity_minutes", value: "15" },
      { key: "booking_horizon_days", value: "60" },
    ];
    fromMap.working_hours = [
      { barberId: 1, dayOfWeek: 3, startTime: "09:00:00", endTime: "19:00:00", active: true },
    ];

    const pastDate = new Date(Date.UTC(2020, 0, 1));
    const slots = await getAvailableSlots({
      serviceId: 1,
      barberId: 1,
      date: pastDate,
      db,
    });
    expect(slots).toEqual([]);
  });

  it("getAvailableSlotsForAnyBarber returns slots with barber IDs", async () => {
    fromMap.barbers = [
      { id: 1, active: true, displayOrder: 1 },
      { id: 2, active: true, displayOrder: 2 },
    ];
    fromMap.services = [{ id: 1, active: true, durationMinutes: 30 }];
    fromMap.settings = [
      { key: "buffer_minutes", value: "15" },
      { key: "slot_granularity_minutes", value: "15" },
      { key: "booking_horizon_days", value: "60" },
    ];
    fromMap.working_hours = [
      { barberId: 1, dayOfWeek: 3, startTime: "09:00:00", endTime: "19:00:00", active: true },
      { barberId: 2, dayOfWeek: 3, startTime: "09:00:00", endTime: "19:00:00", active: true },
    ];

    const wednesday = new Date(Date.UTC(2026, 6, 1));
    const results = await getAvailableSlotsForAnyBarber({
      serviceId: 1,
      date: wednesday,
      db,
    });

    expect(results.length).toBeGreaterThan(0);
    const firstSlot = results[0];
    if (!firstSlot) throw new Error("Expected at least one slot result");
    expect(firstSlot.availableBarberIds).toContain(1);
    expect(firstSlot.availableBarberIds).toContain(2);
  });

  it("getAvailableSlotsForAnyBarber returns empty when no active barbers", async () => {
    fromMap.barbers = [];
    fromMap.services = [{ id: 1, active: true, durationMinutes: 30 }];

    const results = await getAvailableSlotsForAnyBarber({
      serviceId: 1,
      date: new Date(Date.UTC(2026, 6, 1)),
      db,
    });
    expect(results).toEqual([]);
  });

  it("returns empty array for dates beyond booking horizon", async () => {
    fromMap.barbers = [{ id: 1, active: true }];
    fromMap.services = [{ id: 1, active: true, durationMinutes: 30 }];
    fromMap.settings = [
      { key: "buffer_minutes", value: "15" },
      { key: "slot_granularity_minutes", value: "15" },
      { key: "booking_horizon_days", value: "1" },
    ];
    fromMap.working_hours = [
      { barberId: 1, dayOfWeek: 3, startTime: "09:00:00", endTime: "19:00:00", active: true },
    ];

    const farFuture = new Date(Date.UTC(2027, 0, 1));
    const slots = await getAvailableSlots({
      serviceId: 1,
      barberId: 1,
      date: farFuture,
      db,
    });
    expect(slots).toEqual([]);
  });

  it("booking exactly at end of working day is not included", async () => {
    fromMap.barbers = [{ id: 1, active: true }];
    fromMap.services = [{ id: 1, active: true, durationMinutes: 30 }];
    fromMap.settings = [
      { key: "buffer_minutes", value: "15" },
      { key: "slot_granularity_minutes", value: "15" },
      { key: "booking_horizon_days", value: "60" },
    ];
    fromMap.working_hours = [
      { barberId: 1, dayOfWeek: 3, startTime: "09:00:00", endTime: "09:44:00", active: true },
    ];

    const wednesday = new Date(Date.UTC(2026, 6, 1));
    const slots = await getAvailableSlots({
      serviceId: 1,
      barberId: 1,
      date: wednesday,
      db,
    });

    expect(slots.length).toBe(0);
  });
});
