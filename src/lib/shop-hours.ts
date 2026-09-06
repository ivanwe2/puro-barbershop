/**
 * Days the shop is shut, as JS day-of-week numbers (0 = Sunday … 6 = Saturday) —
 * the same numbering as `workingHours.dayOfWeek`.
 *
 * Opening times live per-barber in the `working_hours` table, but a shop-wide
 * closure outranks them: this list is enforced in the availability engine, so a
 * stale or hand-added row can never re-open a closed day, and it drives the
 * "closed" copy in the public site and the admin calendar.
 *
 * To reopen a day, drop it from this list and add the matching `working_hours`
 * rows (see drizzle/migrations/0003_closed_sundays.sql for the inverse).
 */
export const CLOSED_WEEKDAYS: readonly number[] = [0];

/** True when the shop is closed on this JS day-of-week (0 = Sunday). */
export function isClosedWeekday(dayOfWeek: number): boolean {
  return CLOSED_WEEKDAYS.includes(dayOfWeek);
}

/**
 * True when a "yyyy-MM-dd" calendar day falls on a closed day. Parsed as UTC so
 * the answer doesn't shift with the runtime timezone — the string names a
 * calendar day, not an instant.
 */
export function isClosedDateKey(dateKey: string): boolean {
  const date = new Date(`${dateKey}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return false;
  return isClosedWeekday(date.getUTCDay());
}
