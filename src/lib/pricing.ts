// Per-barber pricing resolution. Pure functions only (no DB import) so both
// server and client components can share the exact same rule:
//   effective price(service, barber) = the barber's override if one exists,
//   otherwise the service's shared base price (services.priceBgn, in EUR).

export interface BarberServicePrice {
  barberId: number;
  serviceId: number;
  priceEur: string;
}

const key = (barberId: number, serviceId: number) => `${barberId}:${serviceId}`;

/** Index override rows for O(1) lookup by (barberId, serviceId). */
export function buildPriceIndex(overrides: BarberServicePrice[]): Map<string, number> {
  const index = new Map<string, number>();
  for (const o of overrides) index.set(key(o.barberId, o.serviceId), Number(o.priceEur));
  return index;
}

/** Effective EUR price for a service + barber: override if set, else base. */
export function priceFor(
  index: Map<string, number>,
  serviceId: number,
  basePriceEur: string,
  barberId: number,
): number {
  return index.get(key(barberId, serviceId)) ?? Number(basePriceEur);
}

/**
 * Price spread for a service across the given barbers — used for the "from €X"
 * display. When min === max there's no real variation, so callers can drop the
 * "from" prefix and show a single price (which is also the pre-per-barber
 * behaviour, before any overrides are set).
 */
export function priceRangeFor(
  index: Map<string, number>,
  serviceId: number,
  basePriceEur: string,
  barberIds: number[],
): { min: number; max: number } {
  if (barberIds.length === 0) {
    const base = Number(basePriceEur);
    return { min: base, max: base };
  }
  let min = Infinity;
  let max = -Infinity;
  for (const id of barberIds) {
    const p = priceFor(index, serviceId, basePriceEur, id);
    if (p < min) min = p;
    if (p > max) max = p;
  }
  return { min, max };
}
