"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { shop, shopAddress } from "@/lib/shop";

export default function LocationSection({ locale }: { locale: string }) {
  const t = useTranslations("location");
  const [showMap, setShowMap] = useState(false);
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

        {/* Right: click-to-load Google map (no third-party request until asked) */}
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[4px] border border-[var(--hairline)]">
          {showMap ? (
            <iframe
              title="Google map — Puro Barbershop"
              src={shop.mapsEmbed}
              className="h-full w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              sandbox="allow-scripts allow-same-origin allow-popups"
            />
          ) : (
            <button
              type="button"
              onClick={() => setShowMap(true)}
              className="flex h-full w-full flex-col items-center justify-center gap-3 bg-[var(--paper)] p-6 text-center"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(135deg, #efeae1 0 18px, #eae4d9 18px 36px)",
              }}
            >
              <span className="text-[var(--ink)]" aria-hidden>
                {/* map-pin icon */}
                <svg
                  width="34"
                  height="34"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </span>
              <span className="rounded-[2px] border border-[var(--ink)] px-5 py-2.5 text-[13px] font-bold tracking-[0.08em] text-[var(--ink)] uppercase">
                {t("showMap")}
              </span>
              <span className="max-w-[36ch] text-xs text-[var(--muted-foreground)]">
                {t("mapNotice")}
              </span>
            </button>
          )}
        </div>
      </div>

      {showMap && (
        <div className="mx-auto mt-4 max-w-[1280px] text-right">
          <a
            href={shop.mapsLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-[var(--muted-foreground)] underline underline-offset-4 hover:text-[var(--ink)]"
          >
            {t("openInMaps")} →
          </a>
        </div>
      )}
    </section>
  );
}
