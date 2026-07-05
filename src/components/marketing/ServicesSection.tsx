import ServicesPriceList from "./ServicesPriceList";
import type { BarberServicePrice } from "@/lib/pricing";

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

interface Barber {
  id: number;
  nameEn: string;
  nameBg: string;
}

interface ServicesSectionProps {
  services: Service[];
  barbers: Barber[];
  priceOverrides: BarberServicePrice[];
  t: T;
}

export default function ServicesSection({
  services: serviceList,
  barbers,
  priceOverrides,
  t,
}: ServicesSectionProps) {
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

        <ServicesPriceList services={serviceList} barbers={barbers} overrides={priceOverrides} />
      </div>
    </section>
  );
}
