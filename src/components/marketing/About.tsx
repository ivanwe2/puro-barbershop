interface T {
  (key: string, params?: Record<string, string | number | Date>): string;
}

interface AboutProps {
  t: T;
}

export default function About({ t }: AboutProps) {
  return (
    <section id="about" className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6 lg:px-8">
      <h2 className="font-heading text-foreground text-3xl font-semibold sm:text-4xl">
        {t("aboutTitle")}
      </h2>
      <div className="border-border bg-muted mt-8 h-48 w-full overflow-hidden rounded-lg border">
        <div className="text-muted-foreground flex h-full items-center justify-center">
          [PLACEHOLDER:about_image]
        </div>
      </div>
      <p className="text-muted-foreground mt-8 text-lg leading-relaxed">{t("aboutText")}</p>
    </section>
  );
}
