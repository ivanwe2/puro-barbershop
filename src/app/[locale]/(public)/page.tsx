import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/db";
import { barbers, services, workingHours } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import Hero from "@/components/marketing/Hero";
import About from "@/components/marketing/About";
import BarbersSection from "@/components/marketing/BarbersSection";
import ServicesSection from "@/components/marketing/ServicesSection";
import InstagramGallery from "@/components/marketing/InstagramGallery";
import LocationSection from "@/components/marketing/LocationSection";
import SloganDivider from "@/components/shared/SloganDivider";

export const revalidate = 3600;

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const t = await getTranslations({ locale: params.locale, namespace: "home" });
  const common = await getTranslations({ locale: params.locale, namespace: "common" });
  const baseUrl = process.env.AUTH_URL || "https://purobarbershop.com";

  return {
    title: `${t("heroTitle")} — ${common("slogan")}`,
    description: `${t("heroSubtitle")} | ${t("address")}`,
    alternates: {
      canonical: `${baseUrl}/${params.locale}`,
      languages: {
        bg: `${baseUrl}/bg`,
        en: `${baseUrl}/en`,
      },
    },
    openGraph: {
      title: t("heroTitle"),
      description: common("slogan"),
      url: `${baseUrl}/${params.locale}`,
      siteName: t("heroTitle"),
      locale: params.locale === "bg" ? "bg_BG" : "en_US",
      type: "website",
    },
    twitter: {
      card: "summary",
      title: t("heroTitle"),
      description: common("slogan"),
    },
  };
}

export default async function HomePage(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  const homeT = await getTranslations("home");
  const commonT = await getTranslations("common");
  const servicesT = await getTranslations("services");
  const locationT = await getTranslations("location");

  const activeBarbers = await db
    .select()
    .from(barbers)
    .where(eq(barbers.active, true))
    .orderBy(asc(barbers.displayOrder));

  const activeServices = await db
    .select()
    .from(services)
    .where(eq(services.active, true))
    .orderBy(asc(services.displayOrder));

  const hoursData = await db.select().from(workingHours).where(eq(workingHours.active, true));

  const locale = params.locale;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HairSalon",
    name: locale === "bg" ? "Puro Barbershop" : "Puro Barbershop",
    address: {
      "@type": "PostalAddress",
      streetAddress: locale === "bg" ? "Бул. Христо Ботев 114" : "114 Hristo Botev Blvd",
      addressLocality: "Plovdiv",
      addressCountry: "BG",
    },
    telephone: "[PLACEHOLDER:shop_phone]",
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "09:00",
        closes: "19:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Saturday"],
        opens: "09:00",
        closes: "17:00",
      },
    ],
    priceRange: "$$",
  };

  return (
    <div className="flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Hero t={homeT} common={commonT} />
      <About t={homeT} />
      <SloganDivider />
      <BarbersSection barbers={activeBarbers} t={homeT} />
      <SloganDivider />
      <ServicesSection services={activeServices} t={servicesT} />
      <SloganDivider />
      <InstagramGallery />
      <SloganDivider />
      <LocationSection hoursData={hoursData} t={locationT} />
      <SloganDivider />
      <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
        <h2 className="font-heading text-foreground text-3xl font-semibold sm:text-4xl">
          {homeT("heroTitle")}
        </h2>
        <Link
          href="/book"
          className="border-accent text-accent hover:bg-accent hover:text-accent-foreground mt-6 rounded-md border px-8 py-4 text-xl font-medium transition-colors"
        >
          {commonT("bookNow")}
        </Link>
      </div>
    </div>
  );
}
