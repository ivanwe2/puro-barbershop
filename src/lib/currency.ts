// EURO-CHANGEOVER: this whole module is temporary. Once dual EUR/BGN display is
// no longer required (after Aug 2026), delete this file and its two callers
// (ServicesSection.tsx, book/page.tsx) — grep "EURO-CHANGEOVER" to find them.
//
// Prices are stored in EUR (the `priceBgn` column name is legacy). Bulgaria
// joins the euro area on 1 Jan 2026, and dual EUR/BGN price display is required
// during the changeover period, converted at the official irrevocable rate.
//
// 1 EUR = 1.95583 BGN (fixed rate — never changes).
export const EUR_TO_BGN = 1.95583;

/** Format a EUR amount, dropping the decimals for whole numbers (€25, €24.50). */
export function formatEur(eur: number | string): string {
  const n = Number(eur);
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

/**
 * Convert a EUR amount to BGN at the official fixed rate. Lev amounts rarely
 * land on a round number after conversion, so always show two decimals
 * (e.g. €25 → "48.90 лв.").
 */
export function formatBgn(eur: number | string): string {
  const bgn = Number(eur) * EUR_TO_BGN;
  return bgn.toFixed(2);
}
