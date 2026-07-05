import { getLocale } from "next-intl/server";
import { Link } from "@/lib/i18n/routing";
// EURO-CHANGEOVER: temporary dual EUR/BGN pricing — remove after Aug 2026.
import { formatEur, formatBgn } from "@/lib/currency";

interface T {
  (key: string, params?: Record<string, string | number | Date>): string;
}

interface Service {
  id: number;
  nameEn: string;
  nameBg: string;
  descriptionEn: string | null;
  descriptionBg: string | null;
  durationMinutes: number;
  priceBgn: string;
}

interface ServicesSectionProps {
  services: Service[];
  t: T;
}

export default async function ServicesSection({ services: serviceList, t }: ServicesSectionProps) {
  const locale = await getLocale();
  const name = (s: Service) => (locale === "bg" ? s.nameBg : s.nameEn);

  return (
    <section
      id="services"
      className="border-t border-[var(--hairline)] bg-[var(--surface)] px-[clamp(22px,5vw,40px)] py-[clamp(72px,11vw,120px)]"
    >
      <div className="mx-auto max-w-[1100px]">
        <div className="mb-16 flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="mb-[18px] text-[13px] font-semibold tracking-[0.22em] text-[var(--muted-foreground)] uppercase">
              {t("kicker")}
            </div>
            <h2 className="font-heading m-0 text-[clamp(36px,5vw,64px)] leading-none font-bold tracking-[-0.01em] text-[var(--ink)]">
              {t("menuTitle")}
            </h2>
          </div>
          <p className="max-w-[34ch] text-sm leading-relaxed text-[var(--muted-foreground)]">
            {t("intro")}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-x-[72px] md:grid-cols-2">
          {serviceList.map((service) => (
            <Link
              key={service.id}
              href={`/book?service=${service.id}`}
              className="group flex items-baseline gap-[14px] border-b border-[var(--hairline)] py-[22px]"
            >
              <span className="font-heading text-[22px] font-semibold whitespace-nowrap text-[var(--ink)]">
                {name(service)}
              </span>
              <span className="flex-1 -translate-y-1 border-b border-dotted border-[rgba(21,18,14,0.25)]" />
              {/* EURO-CHANGEOVER: dual price block — after Aug 2026, replace this
                  whole span with a single `€{formatEur(service.priceBgn)}`. */}
              <span className="flex flex-col items-end text-right whitespace-nowrap">
                <span className="text-base font-semibold text-[var(--ink)]">
                  €{formatEur(service.priceBgn)}
                </span>
                <span className="text-xs font-medium text-[var(--muted-foreground)]">
                  {formatBgn(service.priceBgn)} лв.
                </span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
