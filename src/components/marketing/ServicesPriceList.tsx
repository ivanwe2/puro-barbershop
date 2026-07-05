"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/routing";
// EURO-CHANGEOVER: temporary dual EUR/BGN pricing — remove after Aug 2026.
import { formatEur, formatBgn } from "@/lib/currency";
import { buildPriceIndex, priceFor, priceRangeFor, type BarberServicePrice } from "@/lib/pricing";

interface Service {
  id: number;
  nameEn: string;
  nameBg: string;
  priceBgn: string;
}

interface Barber {
  id: number;
  nameEn: string;
  nameBg: string;
}

interface Props {
  services: Service[];
  barbers: Barber[];
  overrides: BarberServicePrice[];
}

/**
 * Editorial price list with a barber selector. Default ("Everyone") shows each
 * service's lowest price with a "from" prefix when barbers differ; picking a
 * barber swaps the column to that barber's exact prices.
 */
export default function ServicesPriceList({ services, barbers, overrides }: Props) {
  const locale = useLocale();
  const t = useTranslations("services");
  const [selected, setSelected] = useState<number | "all">("all");

  const index = useMemo(() => buildPriceIndex(overrides), [overrides]);
  const barberIds = useMemo(() => barbers.map((b) => b.id), [barbers]);

  const name = (s: Service) => (locale === "bg" ? s.nameBg : s.nameEn);
  const barberName = (b: Barber) => (locale === "bg" ? b.nameBg : b.nameEn);

  // Resolve the euro figure(s) to display for a service under the current
  // selection. In "all" mode we may show a "from" range.
  const displayFor = (s: Service): { eur: number; from: boolean } => {
    if (selected === "all") {
      const { min, max } = priceRangeFor(index, s.id, s.priceBgn, barberIds);
      return { eur: min, from: min !== max };
    }
    return { eur: priceFor(index, s.id, s.priceBgn, selected), from: false };
  };

  const pillClass = (active: boolean) =>
    `rounded-full border px-4 py-[6px] text-xs font-semibold tracking-[0.08em] uppercase transition-colors ${
      active
        ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)]"
        : "border-[var(--hairline)] text-[var(--muted-foreground)] hover:border-[var(--ink)] hover:text-[var(--ink)]"
    }`;

  return (
    <>
      {barbers.length > 1 && (
        <div className="mb-12 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelected("all")}
            className={pillClass(selected === "all")}
          >
            {t("everyone")}
          </button>
          {barbers.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => setSelected(b.id)}
              className={pillClass(selected === b.id)}
            >
              {barberName(b)}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-x-[72px] md:grid-cols-2">
        {services.map((service) => {
          const { eur, from } = displayFor(service);
          const bookHref =
            selected === "all"
              ? `/book?service=${service.id}`
              : `/book?service=${service.id}&barber=${selected}`;
          return (
            <Link
              key={service.id}
              href={bookHref}
              className="group flex items-baseline gap-[14px] border-b border-[var(--hairline)] py-[22px]"
            >
              <span className="font-heading text-[22px] font-semibold whitespace-nowrap text-[var(--ink)]">
                {name(service)}
              </span>
              <span className="flex-1 -translate-y-1 border-b border-dotted border-[rgba(21,18,14,0.25)]" />
              {/* EURO-CHANGEOVER: dual price block — after Aug 2026, drop the лв. line. */}
              <span className="flex flex-col items-end text-right whitespace-nowrap">
                <span className="text-base font-semibold text-[var(--ink)]">
                  {from ? `${t("from")} ` : ""}€{formatEur(eur)}
                </span>
                <span className="text-xs font-medium text-[var(--muted-foreground)]">
                  {formatBgn(eur)} лв.
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
