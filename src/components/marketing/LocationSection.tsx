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
          <a
            href={shop.mapsDirections}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-[2px] bg-[var(--ink)] px-6 py-3 text-sm font-bold tracking-[0.04em] text-[var(--paper)] uppercase transition-colors hover:bg-black"
          >
            {t("getDirections")} →
          </a>
        </div>

        {/* Right: the whole embedded map is a link to the Google listing. The
            iframe itself is non-interactive so clicks reach the surrounding
            link (opens Google Maps in a new tab). */}
        <a
          href={shop.mapsLink}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t("openInMaps")}
          className="group relative block aspect-[4/3] w-full overflow-hidden rounded-[4px] border border-[var(--hairline)]"
        >
          <iframe
            title="Google map — Puro Barbershop"
            src={shop.mapsEmbed}
            className="pointer-events-none h-full w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            sandbox="allow-scripts allow-same-origin allow-popups"
          />
          {/* Affordance that the map opens Google Maps on click */}
          <span className="absolute right-3 bottom-3 inline-flex items-center gap-1.5 rounded-[2px] bg-[var(--ink)]/85 px-2.5 py-1.5 text-[11px] font-semibold tracking-[0.06em] text-[var(--paper)] uppercase opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
            {t("openInMaps")}
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M7 17 17 7" />
              <path d="M7 7h10v10" />
            </svg>
          </span>
        </a>
      </div>
    </section>
  );
}
