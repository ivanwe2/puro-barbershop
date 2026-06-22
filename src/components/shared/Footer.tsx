"use client";

import { useTranslations } from "next-intl";
import { env } from "@/lib/env";
import { Link } from "@/lib/i18n/routing";
import SloganDivider from "./SloganDivider";

export default function Footer() {
  const t = useTranslations("footer");
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-border bg-muted border-t">
      <SloganDivider />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div>
            <h3 className="font-heading text-foreground mb-4 text-lg font-semibold">
              Puro Barbershop
            </h3>
            <address className="text-muted-foreground text-sm not-italic">
              <p>{t("address")}</p>
            </address>
            <div className="text-muted-foreground mt-4 text-sm">
              <p>{t("weekdays")}</p>
              <p>{t("saturday")}</p>
              <p>{t("sunday")}</p>
            </div>
          </div>

          <div>
            <h3 className="font-heading text-foreground mb-4 text-lg font-semibold">
              {t("navigation")}
            </h3>
            <nav className="flex flex-col gap-2 text-sm">
              <Link
                href="/book"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("book")}
              </Link>
              <Link
                href="/#services"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("services")}
              </Link>
              <Link
                href="/#gallery"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("gallery")}
              </Link>
              <Link
                href="/#location"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("location")}
              </Link>
            </nav>
          </div>

          <div>
            <h3 className="font-heading text-foreground mb-4 text-lg font-semibold">
              {t("legal")}
            </h3>
            <nav className="flex flex-col gap-2 text-sm">
              <Link
                href="/legal/privacy"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("privacy")}
              </Link>
              <Link
                href="/legal/terms"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("terms")}
              </Link>
              <Link
                href="/legal/cookie-info"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("cookies")}
              </Link>
            </nav>
          </div>
        </div>

        <div className="border-border text-muted-foreground mt-12 flex flex-col items-center justify-between gap-4 border-t pt-6 text-center text-xs md:flex-row">
          <p>{t("copyright", { year: currentYear })}</p>
          <a
            href={env.NEXT_PUBLIC_INSTAGRAM_URL ?? "https://www.instagram.com/"}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Instagram"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
              <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
}
