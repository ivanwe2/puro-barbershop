interface T {
  (key: string, params?: Record<string, string | number | Date>): string;
}

interface StatementProps {
  t: T;
  barberCount: number;
  serviceCount: number;
}

export default function Statement({ t, barberCount, serviceCount }: StatementProps) {
  const stats = [
    { value: String(serviceCount), label: t("statServicesLabel") },
    { value: String(barberCount), label: t("statBarbersLabel") },
    { value: t("statDaysValue"), label: t("statDaysLabel") },
  ];

  return (
    <section className="bg-[var(--paper)] px-[clamp(22px,5vw,40px)] py-[clamp(72px,11vw,120px)]">
      <div className="mx-auto max-w-[1100px]">
        <div className="mb-[34px] text-[13px] font-semibold tracking-[0.22em] text-[var(--muted-foreground)] uppercase">
          {t("statementKicker")}
        </div>
        <p
          className="font-heading m-0 max-w-[20ch] text-[clamp(28px,4.2vw,52px)] leading-[1.18] font-semibold tracking-[-0.01em] text-[var(--ink)]"
          style={{ textWrap: "balance" }}
        >
          {t("statementBody")}
        </p>
        <div className="mt-[72px] grid grid-cols-1 gap-12 sm:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="font-heading text-[44px] font-semibold text-[var(--ink)]">
                {s.value}
              </div>
              <div className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)]">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
