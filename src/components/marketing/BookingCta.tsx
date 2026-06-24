import { Link } from "@/lib/i18n/routing";

interface T {
  (key: string, params?: Record<string, string | number | Date>): string;
}

interface BookingCtaProps {
  t: T;
  common: T;
}

export default function BookingCta({ t, common }: BookingCtaProps) {
  const phone = process.env.NEXT_PUBLIC_SHOP_PHONE || "[PLACEHOLDER:shop_phone]";

  return (
    <section
      id="book"
      className="bg-[#1a1611] px-[clamp(22px,5vw,40px)] py-[clamp(72px,11vw,120px)]"
    >
      <div className="mx-auto max-w-[980px] text-center">
        <div className="mb-[18px] text-[13px] font-semibold tracking-[0.22em] text-[var(--paper)]/50 uppercase">
          {t("ctaKicker")}
        </div>
        <h2 className="font-heading m-0 text-[clamp(36px,5vw,64px)] leading-none font-bold tracking-[-0.01em] text-[#f6f2eb]">
          {t("title")}
        </h2>
        <div className="mt-10">
          <Link
            href="/book"
            className="inline-flex items-center gap-[10px] rounded-[2px] bg-[var(--paper)] px-[30px] py-[18px] text-sm font-bold tracking-[0.04em] text-[var(--ink)] transition-colors hover:bg-white"
          >
            {common("bookNow")} <span className="text-base">→</span>
          </Link>
        </div>
        <p className="mt-[18px] text-[13px] text-[var(--paper)]/50">
          {t("ctaCall")} <span className="font-semibold text-[var(--paper)]">{phone}</span> ·{" "}
          {t("walkins")}
        </p>
      </div>
    </section>
  );
}
