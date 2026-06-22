import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const t = await getTranslations({ locale: params.locale, namespace: "booking" });

  return {
    title: t("title"),
    description: t("title"),
    robots: { index: false, follow: true },
  };
}

export default function BookLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
