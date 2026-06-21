interface T {
  (key: string, params?: Record<string, string | number | Date>): string;
}

interface WorkingHour {
  barberId: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface LocationSectionProps {
  hoursData: WorkingHour[];
  t: T;
}

const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function LocationSection({ hoursData, t }: LocationSectionProps) {
  const address = process.env.NEXT_PUBLIC_SHOP_ADDRESS ?? "";
  const encodedAddress = encodeURIComponent(address);
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;

  const hoursByDay = hoursData
    .filter((h) => h.barberId === 1)
    .sort((a, b) => a.dayOfWeek - b.dayOfWeek);

  return (
    <section id="location" className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <h2 className="font-heading text-foreground mb-12 text-center text-3xl font-semibold sm:text-4xl">
        {t("title")}
      </h2>
      <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
        <div>
          <h3 className="font-heading text-foreground mb-4 text-xl font-semibold">
            {t("address")}
          </h3>
          <p className="text-muted-foreground">{address}</p>
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="border-accent text-accent hover:bg-accent hover:text-accent-foreground mt-4 inline-block rounded-md border px-4 py-2 text-sm font-medium transition-colors"
          >
            {t("getDirections")}
          </a>
        </div>
        <div>
          <h3 className="font-heading text-foreground mb-4 text-xl font-semibold">{t("hours")}</h3>
          <div className="text-muted-foreground space-y-2 text-sm">
            {hoursByDay.map((h) => (
              <div key={h.dayOfWeek} className="flex justify-between">
                <span>{dayLabels[h.dayOfWeek]}</span>
                <span>
                  {h.startTime}–{h.endTime}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
