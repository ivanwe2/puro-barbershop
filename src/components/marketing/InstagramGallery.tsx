"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { env } from "@/lib/env";

const LIGHTWIDGET_EMBED_URL = "https://lightwidget.com/w/widgets/";

const TILE_BG = "repeating-linear-gradient(135deg, #241f1a 0 18px, #1d1813 18px 36px)";

// Asymmetric layout: one tall, one wide, the rest square (per spec §06).
const TILES = [
  { label: "IG photo", className: "row-span-2 aspect-[1/2]" },
  { label: "IG photo", className: "aspect-square" },
  { label: "IG photo", className: "aspect-square" },
  { label: "IG photo", className: "aspect-square" },
  { label: "IG photo", className: "aspect-square" },
  { label: "IG photo", className: "aspect-square" },
  { label: "IG reel", className: "col-span-2 aspect-[2/1]" },
];

export default function InstagramGallery() {
  const t = useTranslations("gallery");
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const widgetId = env.NEXT_PUBLIC_LIGHTWIDGET_ID;
  const instagramUrl = env.NEXT_PUBLIC_INSTAGRAM_URL ?? "https://www.instagram.com/";
  const showFeed = loaded && widgetId && !error;

  return (
    <section
      id="gallery"
      className="bg-[var(--ink)] px-[clamp(22px,5vw,40px)] py-[clamp(72px,11vw,120px)]"
    >
      <div className="mx-auto max-w-[1280px]">
        <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="mb-[18px] text-[13px] font-semibold tracking-[0.22em] text-[var(--paper)]/50 uppercase">
              {t("kicker")}
            </div>
            <h2 className="font-heading m-0 text-[clamp(36px,5vw,64px)] leading-none font-bold tracking-[-0.01em] text-[#f6f2eb]">
              {t("heading")}
            </h2>
          </div>
          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="border-b border-[var(--paper)]/30 pb-1 text-[13px] font-semibold tracking-[0.08em] text-[var(--paper)]/80 uppercase transition-colors hover:text-[var(--paper)]"
          >
            {t("handle")} →
          </a>
        </div>

        {showFeed ? (
          <div>
            <iframe
              src={`${LIGHTWIDGET_EMBED_URL}${widgetId}`}
              title="Instagram feed"
              className="w-full border-none"
              style={{ minHeight: "600px" }}
              sandbox="allow-scripts allow-same-origin allow-popups"
              referrerPolicy="strict-origin-when-cross-origin"
              onError={() => setError(true)}
            />
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setLoaded(false)}
                className="text-sm font-medium text-[var(--paper)]/60 transition-colors hover:text-[var(--paper)]"
              >
                {t("hideFeed")}
              </button>
            </div>
          </div>
        ) : (
          <div className="relative">
            <div className="grid auto-rows-fr grid-cols-2 gap-[14px] md:grid-cols-4">
              {TILES.map((tile, i) => (
                <div
                  key={i}
                  className={`flex items-end rounded-[2px] p-3 ${tile.className}`}
                  style={{ background: TILE_BG }}
                >
                  <span className="font-mono text-[10px] tracking-[0.1em] text-[var(--paper)]/30">
                    {tile.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Click-to-load consent surface (GDPR): no third-party request
                fires until the user explicitly loads the feed. */}
            <div className="mt-8 flex flex-col items-center gap-3 text-center">
              <p className="max-w-[44ch] text-xs text-[var(--paper)]/45">{t("loadingNotice")}</p>
              {widgetId && !error ? (
                <button
                  type="button"
                  onClick={() => setLoaded(true)}
                  className="rounded-[2px] border border-[var(--paper)]/40 px-6 py-3 text-[13px] font-bold tracking-[0.08em] text-[var(--paper)] uppercase transition-colors hover:bg-[var(--paper)] hover:text-[var(--ink)]"
                >
                  {t("showFeed")}
                </button>
              ) : (
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-[2px] border border-[var(--paper)]/40 px-6 py-3 text-[13px] font-bold tracking-[0.08em] text-[var(--paper)] uppercase transition-colors hover:bg-[var(--paper)] hover:text-[var(--ink)]"
                >
                  {t("seeMoreOnInstagram")}
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
