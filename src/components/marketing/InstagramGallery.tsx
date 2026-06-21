"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { env } from "@/lib/env";

const LIGHTWIDGET_EMBED_URL = "https://lightwidget.com/w/widgets/";

export default function InstagramGallery() {
  const t = useTranslations("gallery");
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const widgetId = env.NEXT_PUBLIC_LIGHTWIDGET_ID;
  const instagramUrl = env.NEXT_PUBLIC_INSTAGRAM_URL ?? "https://www.instagram.com/";

  if (!widgetId) {
    return (
      <section id="gallery" className="mx-auto max-w-7xl px-4 py-24 text-center sm:px-6 lg:px-8">
        <h2 className="font-heading text-foreground text-3xl font-semibold sm:text-4xl">
          {t("title")}
        </h2>
        <div className="border-border bg-muted mt-8 h-64 w-full overflow-hidden rounded-lg border">
          <div className="text-muted-foreground flex h-full items-center justify-center">
            [PLACEHOLDER:instagram_widget_id]
          </div>
        </div>
        <a
          href={instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="border-accent text-accent hover:bg-accent hover:text-accent-foreground mt-6 inline-block rounded-md border px-6 py-3 text-sm font-medium transition-colors"
        >
          {t("seeMoreOnInstagram")}
        </a>
      </section>
    );
  }

  if (error) {
    return (
      <section id="gallery" className="mx-auto max-w-7xl px-4 py-24 text-center sm:px-6 lg:px-8">
        <h2 className="font-heading text-foreground text-3xl font-semibold sm:text-4xl">
          {t("title")}
        </h2>
        <div className="border-border bg-muted mt-8 rounded-lg border p-8">
          <p className="text-muted-foreground text-sm">{t("loadingNotice")}</p>
          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="border-accent text-accent hover:bg-accent hover:text-accent-foreground mt-4 inline-block rounded-md border px-6 py-3 text-sm font-medium transition-colors"
          >
            {t("seeMoreOnInstagram")}
          </a>
        </div>
      </section>
    );
  }

  return (
    <section id="gallery" className="mx-auto max-w-7xl px-4 py-24 text-center sm:px-6 lg:px-8">
      <h2 className="font-heading text-foreground text-3xl font-semibold sm:text-4xl">
        {t("title")}
      </h2>

      {!loaded ? (
        <div className="border-border bg-muted mt-8 rounded-lg border p-12">
          <svg
            className="text-muted-foreground mx-auto h-12 w-12"
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
          </svg>
          <p className="text-muted-foreground mt-4 text-sm">{t("loadingNotice")}</p>
          <button
            type="button"
            onClick={() => {
              setLoaded(true);
            }}
            className="border-accent bg-accent/10 text-accent hover:bg-accent hover:text-accent-foreground mt-6 inline-block rounded-md px-6 py-3 text-sm font-medium transition-colors"
          >
            {t("showFeed")}
          </button>
        </div>
      ) : (
        <div className="mt-8">
          <iframe
            src={`${LIGHTWIDGET_EMBED_URL}${widgetId}`}
            title="Instagram feed"
            className="w-full border-none"
            style={{ minHeight: "600px" }}
            sandbox="allow-scripts allow-same-origin allow-popups"
            referrerPolicy="strict-origin-when-cross-origin"
            onLoad={() => {}}
            onError={() => setError(true)}
          />
          <div className="mt-6 flex items-center justify-center gap-4">
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="border-accent text-accent hover:bg-accent hover:text-accent-foreground inline-block rounded-md border px-6 py-3 text-sm font-medium transition-colors"
            >
              {t("seeMoreOnInstagram")}
            </a>
            <button
              type="button"
              onClick={() => setLoaded(false)}
              className="text-muted-foreground hover:text-foreground inline-block rounded-md px-4 py-3 text-sm font-medium transition-colors"
            >
              {t("hideFeed")}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
