// Everything the shop cares about happens in Sofia wall-clock time, but
// timestamps are stored as true UTC instants and the runtime timezone differs
// (server = UTC, admin browser = Europe/Sofia). Formatting a stored instant
// with the ambient timezone therefore yields different results on server vs
// client — wrong times in emails and React hydration mismatches.
//
// These helpers pin every conversion to Europe/Sofia explicitly, so they
// return identical output regardless of where they run.

const SOFIA_TZ = "Europe/Sofia";

type SofiaParts = {
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
};

function sofiaParts(date: Date): SofiaParts {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: SOFIA_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
  };
}

/** "HH:mm" wall-clock time in Sofia (e.g. 07:00 UTC → "10:00"). */
export function sofiaTime(date: Date): string {
  const p = sofiaParts(date);
  return `${p.hour}:${p.minute}`;
}

/** "yyyy-MM-dd" Sofia calendar day — stable key for grouping/comparison. */
export function sofiaDateKey(date: Date): string {
  const p = sofiaParts(date);
  return `${p.year}-${p.month}-${p.day}`;
}

/** "dd.MM.yyyy" Sofia date. */
export function sofiaShortDate(date: Date): string {
  const p = sofiaParts(date);
  return `${p.day}.${p.month}.${p.year}`;
}

/** "dd.MM.yyyy HH:mm" Sofia date + time. */
export function sofiaShortDateTime(date: Date): string {
  const p = sofiaParts(date);
  return `${p.day}.${p.month}.${p.year} ${p.hour}:${p.minute}`;
}

/** Value for an `<input type="datetime-local">` in Sofia wall time. */
export function sofiaDateTimeLocal(date: Date): string {
  const p = sofiaParts(date);
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

/** Localized long date in Sofia, e.g. "Tuesday, July 14, 2026". */
export function sofiaLongDate(date: Date, locale: "bg" | "en" = "en"): string {
  return new Intl.DateTimeFormat(locale === "bg" ? "bg-BG" : "en-US", {
    timeZone: SOFIA_TZ,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

/** Localized time in Sofia, e.g. "10:00". */
export function sofiaLocalizedTime(date: Date, locale: "bg" | "en" = "en"): string {
  return new Intl.DateTimeFormat(locale === "bg" ? "bg-BG" : "en-US", {
    timeZone: SOFIA_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

// Offset (ms) to add to a UTC instant to read it as Sofia wall-clock.
function sofiaOffsetMs(date: Date): number {
  const p = sofiaParts(date);
  const asWallUtc = Date.UTC(
    Number(p.year),
    Number(p.month) - 1,
    Number(p.day),
    Number(p.hour),
    Number(p.minute),
  );
  // Round the instant down to the minute so the subtraction is exact.
  const flooredInstant = Math.floor(date.getTime() / 60000) * 60000;
  return asWallUtc - flooredInstant;
}

/**
 * Convert a Sofia wall-clock string ("yyyy-MM-ddTHH:mm", as produced by a
 * datetime-local input) into the true UTC instant it denotes — independent of
 * the runtime timezone. Inverse of {@link sofiaDateTimeLocal}.
 */
export function sofiaWallToInstant(wall: string): Date {
  // Interpret the wall string as if it were UTC to get a provisional instant,
  // then correct by the Sofia offset that applies around that instant.
  const provisional = new Date(`${wall}:00Z`);
  const offset = sofiaOffsetMs(provisional);
  return new Date(provisional.getTime() - offset);
}
