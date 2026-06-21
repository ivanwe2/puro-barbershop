import Link from "next/link";

interface T {
  (key: string, params?: Record<string, string | number | Date>): string;
}

interface HeroProps {
  t: T;
  common: T;
}

export default function Hero({ t, common }: HeroProps) {
  return (
    <section className="relative flex min-h-[80vh] items-center justify-center overflow-hidden">
      <div className="from-muted/50 to-background absolute inset-0 bg-gradient-to-b">
        <div className="absolute inset-0 bg-[url('/hero-placeholder.jpg')] bg-cover bg-center opacity-30" />
      </div>

      <div className="relative z-10 flex flex-col items-center px-4 text-center">
        <img
          src="/logo.svg"
          alt="Puro Barbershop"
          width={120}
          height={120}
          className="mb-8 h-24 w-auto"
        />
        <h1 className="font-heading text-foreground text-5xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
          {t("heroTitle")}
        </h1>
        <p className="font-heading text-muted-foreground mt-4 text-2xl italic sm:text-3xl">
          {t("heroSubtitle")}
        </p>
        <Link
          href="/book"
          className="border-accent text-accent hover:bg-accent hover:text-accent-foreground mt-8 rounded-md border px-8 py-4 text-xl font-medium transition-colors"
        >
          {common("bookNow")}
        </Link>
      </div>
    </section>
  );
}
