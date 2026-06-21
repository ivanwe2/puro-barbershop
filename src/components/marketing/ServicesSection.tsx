import Link from "next/link";

interface T {
  (key: string, params?: Record<string, string | number | Date>): string;
}

interface Service {
  id: number;
  nameEn: string;
  nameBg: string;
  descriptionEn: string | null;
  descriptionBg: string | null;
  durationMinutes: number;
  priceBgn: string;
}

interface ServicesSectionProps {
  services: Service[];
  t: T;
}

export default function ServicesSection({ services: serviceList, t }: ServicesSectionProps) {
  return (
    <section id="services" className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <h2 className="font-heading text-foreground mb-12 text-center text-3xl font-semibold sm:text-4xl">
        {t("title")}
      </h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {serviceList.map((service) => (
          <div
            key={service.id}
            className="border-border bg-card flex flex-col overflow-hidden rounded-lg border"
          >
            <div className="flex-1 p-6">
              <h3 className="font-heading text-foreground text-xl font-semibold">
                {service.nameEn}
              </h3>
              {service.descriptionEn && (
                <p className="text-muted-foreground mt-2 text-sm">{service.descriptionEn}</p>
              )}
              <div className="text-muted-foreground mt-4 flex items-center gap-4 text-sm">
                <span>{service.durationMinutes} min</span>
                <span>{service.priceBgn} лв</span>
              </div>
            </div>
            <div className="border-border border-t p-4">
              <Link
                href={`/book?service=${service.id}`}
                className="border-accent text-accent hover:bg-accent hover:text-accent-foreground block rounded-md border px-4 py-2 text-center text-sm font-medium transition-colors"
              >
                {t("bookThisService")}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
