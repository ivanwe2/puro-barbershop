import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { db } from "@/db";
import { barbers, services } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import Hero from "@/components/marketing/Hero";
import Statement from "@/components/marketing/Statement";
import BarbersSection from "@/components/marketing/BarbersSection";
import ServicesSection from "@/components/marketing/ServicesSection";
import InstagramGallery from "@/components/marketing/InstagramGallery";
import ReviewsSection from "@/components/marketing/ReviewsSection";
import BookingCta from "@/components/marketing/BookingCta";

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
  const bookingT = await getTranslations("booking");

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

  const locale = params.locale;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HairSalon",
    name: "Puro Barbershop",
    address: {
      "@type": "PostalAddress",
      streetAddress: locale === "bg" ? "Бул. Христо Ботев 114" : "114 Hristo Botev Blvd",
      addressLocality: "Plovdiv",
      addressCountry: "BG",
    },
    telephone: process.env.NEXT_PUBLIC_SHOP_PHONE || "[PLACEHOLDER:shop_phone]",
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        opens: "10:00",
        closes: "19:30",
      },
    ],
    priceRange: "$$",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Hero t={homeT} common={commonT} />
      {/* Sentinel at the hero's bottom drives the nav's transparent→solid state. */}
      <div id="nav-sentinel" className="relative h-px w-full" />
      <Statement
        t={homeT}
        barberCount={activeBarbers.length}
        serviceCount={activeServices.length}
      />
      <ServicesSection services={activeServices} t={servicesT} />
      <BarbersSection barbers={activeBarbers} t={homeT} />
      <InstagramGallery />
      <ReviewsSection />
      <BookingCta t={bookingT} common={commonT} />
    </>
  );
}
