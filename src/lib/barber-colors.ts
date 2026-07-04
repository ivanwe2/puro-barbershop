// Per-barber colours for the schedule calendar. Tuned for the light admin
// theme: a soft tinted fill, a saturated border, and dark text so tiles read
// clearly against the paper background. `dot` is the legend swatch.

const PALETTE = [
  { tile: "bg-blue-100 border-blue-500 text-blue-900", dot: "bg-blue-500" },
  { tile: "bg-amber-100 border-amber-500 text-amber-900", dot: "bg-amber-500" },
  { tile: "bg-emerald-100 border-emerald-600 text-emerald-900", dot: "bg-emerald-600" },
  { tile: "bg-violet-100 border-violet-500 text-violet-900", dot: "bg-violet-500" },
  { tile: "bg-rose-100 border-rose-500 text-rose-900", dot: "bg-rose-500" },
  { tile: "bg-teal-100 border-teal-600 text-teal-900", dot: "bg-teal-600" },
] as const;

const FALLBACK = { tile: "bg-gray-100 border-gray-400 text-gray-900", dot: "bg-gray-400" } as const;

export function barberColor(id: number): { tile: string; dot: string } {
  if (!Number.isFinite(id) || id < 1) return FALLBACK;
  return PALETTE[(id - 1) % PALETTE.length] ?? FALLBACK;
}
