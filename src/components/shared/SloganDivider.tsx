"use client";

import { useTranslations } from "next-intl";

export default function SloganDivider() {
  const t = useTranslations("common");
  const slogan = t("slogan");
  const parts = slogan.split(" · ");

  return (
    <div className="flex items-center justify-center gap-4 py-12">
      {parts.map((part) => (
        <span key={part} className="font-heading text-muted-foreground text-xl italic">
          {part}
        </span>
      ))}
    </div>
  );
}
