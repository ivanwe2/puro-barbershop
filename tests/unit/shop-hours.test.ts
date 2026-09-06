import { describe, it, expect } from "vitest";
import { CLOSED_WEEKDAYS, isClosedWeekday, isClosedDateKey } from "@/lib/shop-hours";

describe("shop hours", () => {
  it("treats Sunday as closed and every other day as open", () => {
    expect(CLOSED_WEEKDAYS).toEqual([0]);
    expect(isClosedWeekday(0)).toBe(true);
    for (const day of [1, 2, 3, 4, 5, 6]) {
      expect(isClosedWeekday(day)).toBe(false);
    }
  });

  it("resolves a yyyy-MM-dd key to the right weekday", () => {
    // 2026-09-13 is a Sunday; 2026-09-12 a Saturday, 2026-09-14 a Monday.
    expect(isClosedDateKey("2026-09-13")).toBe(true);
    expect(isClosedDateKey("2026-09-12")).toBe(false);
    expect(isClosedDateKey("2026-09-14")).toBe(false);
  });

  it("is independent of the runtime timezone", () => {
    // A date key names a calendar day, not an instant — parsing it as local
    // time would flip the answer either side of UTC on the day boundary.
    const original = process.env.TZ;
    try {
      for (const tz of ["UTC", "Europe/Sofia", "Pacific/Kiritimati", "Pacific/Midway"]) {
        process.env.TZ = tz;
        expect(isClosedDateKey("2026-09-13")).toBe(true);
        expect(isClosedDateKey("2026-09-14")).toBe(false);
      }
    } finally {
      process.env.TZ = original;
    }
  });

  it("does not flag an unparseable date as closed", () => {
    expect(isClosedDateKey("")).toBe(false);
    expect(isClosedDateKey("not-a-date")).toBe(false);
  });
});
