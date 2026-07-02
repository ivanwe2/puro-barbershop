"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/routing";
import Wordmark from "@/components/shared/Wordmark";
import { shop } from "@/lib/shop";

export default function Footer() {
  const t = useTranslations("footer");
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[var(--ink)] text-[var(--paper)]">
      <div className="mx-auto max-w-[1280px] px-[clamp(22px,5vw,40px)] pt-[clamp(56px,9vw,84px)] pb-10">
        {/* Thin pole rule — the second and final appearance of the swirl. */}
        <div className="pole-rule mb-16 h-1 w-full rounded-[2px] opacity-85" />

        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Wordmark className="mb-[18px] block text-[42px]" />
            <p className="max-w-[30ch] text-sm leading-relaxed text-[var(--paper)]/60">
              {t("blurb")}
            </p>
          </div>

          <div>
            <h3 className="mb-[18px] text-xs font-bold tracking-[0.14em] text-[var(--paper)]/50 uppercase">
              {t("visit")}
            </h3>
            <address className="text-sm leading-[1.8] text-[var(--paper)]/85 not-italic">
              {t("address")}
            </address>
            <a
              href={shop.mapsDirections}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block border-b border-[var(--paper)]/30 pb-0.5 text-sm text-[var(--paper)]/85 transition-colors hover:text-[var(--paper)]"
            >
              {t("directions")} →
            </a>
          </div>

          <div>
            <h3 className="mb-[18px] text-xs font-bold tracking-[0.14em] text-[var(--paper)]/50 uppercase">
              {t("hours")}
            </h3>
            <p className="text-sm leading-[1.8] text-[var(--paper)]/85">{t("hoursDaily")}</p>
          </div>

          <div>
            <h3 className="mb-[18px] text-xs font-bold tracking-[0.14em] text-[var(--paper)]/50 uppercase">
              {t("connect")}
            </h3>
            <nav className="flex flex-col gap-1 text-sm leading-[1.8] text-[var(--paper)]/85">
              <a
                href={shop.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-[var(--paper)]"
              >
                {t("instagram")}
              </a>
              <a
                href={shop.tiktok}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-[var(--paper)]"
              >
                {t("tiktok")}
              </a>
              <a href={shop.phoneHref} className="transition-colors hover:text-[var(--paper)]">
                {t("call")}
              </a>
            </nav>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-3 border-t border-[var(--paper)]/12 pt-6 text-xs text-[var(--paper)]/40 md:flex-row">
          <span>{t("copyright", { year: currentYear })}</span>
          <nav className="flex items-center gap-4">
            <Link href="/legal/privacy" className="transition-colors hover:text-[var(--paper)]">
              {t("privacy")}
            </Link>
            <Link href="/legal/terms" className="transition-colors hover:text-[var(--paper)]">
              {t("terms")}
            </Link>
            <Link href="/legal/cookie-info" className="transition-colors hover:text-[var(--paper)]">
              {t("cookies")}
            </Link>
          </nav>
          <span className="hidden md:inline">{t("slogan")}</span>
        </div>
      </div>
    </footer>
  );
}
