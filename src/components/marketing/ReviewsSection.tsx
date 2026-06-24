import { getTranslations } from "next-intl/server";

export default async function ReviewsSection() {
  const t = await getTranslations("reviews");

  const reviews = [
    { quote: t("r1Quote"), name: t("r1Name"), since: t("r1Since") },
    { quote: t("r2Quote"), name: t("r2Name"), since: t("r2Since") },
    { quote: t("r3Quote"), name: t("r3Name"), since: t("r3Since") },
  ];

  return (
    <section
      id="reviews"
      className="bg-[var(--paper)] px-[clamp(22px,5vw,40px)] py-[clamp(72px,11vw,120px)]"
    >
      <div className="mx-auto max-w-[1280px]">
        <div className="mb-[18px] text-center text-[13px] font-semibold tracking-[0.22em] text-[var(--muted-foreground)] uppercase">
          {t("kicker")}
        </div>
        <h2 className="font-heading mb-16 text-center text-[clamp(36px,5vw,64px)] leading-none font-bold tracking-[-0.01em] text-[var(--ink)]">
          {t("title")}
        </h2>
        <div className="grid grid-cols-1 gap-7 md:grid-cols-3">
          {reviews.map((r) => (
            <div
              key={r.name}
              className="rounded-[3px] border border-[var(--hairline)] bg-[var(--surface)] p-9"
            >
              <div className="mb-5 text-[15px] tracking-[3px] text-[var(--pole-red)]" aria-hidden>
                ★★★★★
              </div>
              <p className="font-heading m-0 mb-6 text-[21px] leading-[1.4] font-semibold text-[var(--ink)]">
                “{r.quote}”
              </p>
              <div className="text-[13px] font-semibold text-[var(--ink)]">{r.name}</div>
              <div className="mt-0.5 text-xs text-[var(--muted-foreground)]">{r.since}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
