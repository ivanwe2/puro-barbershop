interface T {
  (key: string, params?: Record<string, string | number | Date>): string;
}

interface Barber {
  id: number;
  nameEn: string;
  nameBg: string;
  bioEn: string | null;
  bioBg: string | null;
  photoUrl: string | null;
}

interface BarbersSectionProps {
  barbers: Barber[];
  t: T;
}

export default function BarbersSection({ barbers, t }: BarbersSectionProps) {
  return (
    <section id="barbers" className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <h2 className="font-heading text-foreground mb-12 text-center text-3xl font-semibold sm:text-4xl">
        {t("barbersTitle")}
      </h2>
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {barbers.map((barber) => (
          <div
            key={barber.id}
            className="border-border bg-card flex flex-col items-center overflow-hidden rounded-lg border p-6 text-center"
          >
            {barber.photoUrl ? (
              <img
                src={barber.photoUrl}
                alt={barber.nameEn}
                className="mb-4 h-28 w-28 rounded-full object-cover"
              />
            ) : (
              <div className="bg-muted text-muted-foreground mb-4 flex h-28 w-28 items-center justify-center rounded-full text-xl font-semibold">
                {barber.nameEn.charAt(0)}
              </div>
            )}
            <h3 className="font-heading text-foreground text-xl font-semibold">{barber.nameEn}</h3>
            {barber.bioEn && <p className="text-muted-foreground mt-2 text-sm">{barber.bioEn}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}
