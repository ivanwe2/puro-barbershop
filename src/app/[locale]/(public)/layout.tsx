import type { ReactNode } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const common = await getTranslations({ locale: params.locale, namespace: "common" });
  const baseUrl = process.env.AUTH_URL || "https://purobarbershop.com";

  return {
    title: {
      default: "Puro Barbershop",
      template: `%s | Puro Barbershop`,
    },
    description: common("slogan"),
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: `${baseUrl}/${params.locale}`,
      languages: {
        bg: `${baseUrl}/bg`,
        en: `${baseUrl}/en`,
      },
    },
  };
}

export default async function PublicLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
