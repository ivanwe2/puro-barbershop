import { getTranslations } from "next-intl/server";
import { shop, shopAddress } from "@/lib/shop";

export default async function LocationSection({ locale }: { locale: string }) {
  const t = await getTranslations("location");
  const address = shopAddress(locale);

  return (
    <section
      id="location"
      className="border-t border-[var(--hairline)] bg-[var(--surface)] px-[clamp(22px,5vw,40px)] py-[clamp(72px,11vw,120px)]"
    >
      <div className="mx-auto grid max-w-[1280px] grid-cols-1 items-center gap-12 lg:grid-cols-2">
        {/* Left: address + hours + directions */}
        <div>
          <div className="mb-[18px] text-[13px] font-semibold tracking-[0.22em] text-[var(--muted-foreground)] uppercase">
            {t("kicker")}
          </div>
          <h2 className="font-heading m-0 text-[clamp(36px,5vw,64px)] leading-none font-bold tracking-[-0.01em] text-[var(--ink)]">
            {t("findUs")}
          </h2>
          <address className="mt-8 text-lg leading-relaxed text-[var(--ink)] not-italic">
            {address}
          </address>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">{t("hoursDaily")}</p>
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
            <a
              href={shop.mapsDirections}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-[2px] bg-[var(--ink)] px-6 py-3 text-sm font-bold tracking-[0.04em] text-[var(--paper)] uppercase transition-colors hover:bg-black"
            >
              {t("getDirections")} →
            </a>
            <a
              href={shop.mapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[var(--muted-foreground)] underline underline-offset-4 hover:text-[var(--ink)]"
            >
              {t("openInMaps")} →
            </a>
          </div>
        </div>

        {/* Right: embedded Google map (lazy — loads when scrolled into view) */}
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[4px] border border-[var(--hairline)]">
          <iframe
            title="Google map — Puro Barbershop"
            src={shop.mapsEmbed}
            className="h-full w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            sandbox="allow-scripts allow-same-origin allow-popups"
          />
        </div>
      </div>
    </section>
  );
}
