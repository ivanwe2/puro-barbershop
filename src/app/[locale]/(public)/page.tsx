import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { db } from "@/db";
import { barbers, services, workingHours } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import Hero from "@/components/marketing/Hero";
import About from "@/components/marketing/About";
import BarbersSection from "@/components/marketing/BarbersSection";
import ServicesSection from "@/components/marketing/ServicesSection";
import GalleryPlaceholder from "@/components/marketing/GalleryPlaceholder";
import LocationSection from "@/components/marketing/LocationSection";
import SloganDivider from "@/components/shared/SloganDivider";

export default async function HomePage() {
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

  return (
    <div className="flex flex-col">
      <Hero t={homeT} common={commonT} />
      <About t={homeT} />
      <SloganDivider />
      <BarbersSection barbers={activeBarbers} t={homeT} />
      <SloganDivider />
      <ServicesSection services={activeServices} t={servicesT} />
      <SloganDivider />
      <GalleryPlaceholder />
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
