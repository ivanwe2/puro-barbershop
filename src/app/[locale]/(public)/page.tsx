"use client";

import { useTranslations } from "next-intl";
import SloganDivider from "@/components/shared/SloganDivider";
import { Link } from "@/lib/i18n/routing";

export default function HomePage() {
  const t = useTranslations("home");
  const common = useTranslations("common");

  return (
    <div className="flex flex-col items-center justify-center px-4 py-24 text-center">
      <h1 className="font-heading text-foreground text-5xl font-semibold tracking-tight sm:text-6xl">
        {t("heroTitle")}
      </h1>
      <SloganDivider />
      <p className="text-muted-foreground mt-4 max-w-md text-lg">{t("heroSubtitle")}</p>
      <Link
        href="/book"
        className="border-accent text-accent hover:bg-accent hover:text-accent-foreground mt-8 rounded-md border px-6 py-3 text-lg font-medium transition-colors"
      >
        {common("bookNow")}
      </Link>
    </div>
  );
}
