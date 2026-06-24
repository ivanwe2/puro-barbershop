import { getLocale } from "next-intl/server";

interface T {
  (key: string, params?: Record<string, string | number | Date>): string;
}

interface Barber {
  id: number;
  nameEn: string;
  nameBg: string;
  bioEn: string | null;
  bioBg: string | null;
  photoUrl: string | null;
}

interface BarbersSectionProps {
  barbers: Barber[];
  t: T;
}

export default async function BarbersSection({ barbers, t }: BarbersSectionProps) {
  const locale = await getLocale();
  const name = (b: Barber) => (locale === "bg" ? b.nameBg : b.nameEn);
  const bio = (b: Barber) => (locale === "bg" ? b.bioBg : b.bioEn);

  return (
    <section
      id="barbers"
      className="bg-[var(--paper)] px-[clamp(22px,5vw,40px)] py-[clamp(72px,11vw,120px)]"
    >
      <div className="mx-auto max-w-[1280px]">
        <div className="mb-[18px] text-[13px] font-semibold tracking-[0.22em] text-[var(--muted-foreground)] uppercase">
          {t("barbersKicker")}
        </div>
        <h2 className="font-heading mb-[60px] text-[clamp(36px,5vw,64px)] leading-none font-bold tracking-[-0.01em] text-[var(--ink)]">
          {t("barbersTitle")}
        </h2>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {barbers.map((barber) => (
            <div key={barber.id}>
              <div className="relative aspect-[3/4] overflow-hidden rounded-[3px] bg-[#e7e1d6]">
                {barber.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={barber.photoUrl}
                    alt={name(barber)}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div
                    className="flex h-full w-full items-end justify-center pb-[14px]"
                    style={{
                      background:
                        "repeating-linear-gradient(135deg, #e7e1d6 0 16px, #e1dace 16px 32px)",
                    }}
                  >
                    <span className="font-mono text-[10px] tracking-[0.12em] text-[#a99f8f] uppercase">
                      portrait
                    </span>
                  </div>
                )}
              </div>
              <div className="font-heading mt-5 text-[26px] font-semibold text-[var(--ink)]">
                {name(barber)}
              </div>
              {bio(barber) && (
                <div className="mt-3 text-sm leading-relaxed text-[var(--muted-foreground)]">
                  {bio(barber)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
