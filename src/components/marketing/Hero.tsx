import { Link } from "@/lib/i18n/routing";

interface T {
  (key: string, params?: Record<string, string | number | Date>): string;
}

interface HeroProps {
  t: T;
  common: T;
}

export default function Hero({ t, common }: HeroProps) {
  // Slogan rendered as stacked Bodoni lines: "Precision." / "Confidence." / ...
  const lines = common("slogan")
    .split("·")
    .map((part) => part.trim())
    .filter(Boolean);

  return (
    <header
      id="top"
      className="relative h-screen min-h-[680px] w-full overflow-hidden bg-[#100d0a]"
    >
      {/* Hero media. Drop a real loop in by replacing this block with:
          <video autoPlay muted loop playsInline poster="/hero-poster.jpg" …>
          For now a Ken-Burns gradient placeholder stands in. */}
      <div
        className="ken-burns absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 70% 20%, rgba(60,52,44,0.55), rgba(0,0,0,0) 60%), repeating-linear-gradient(135deg, #1a1612 0 22px, #161310 22px 44px)",
        }}
      />
      {/* Legibility scrim, top & bottom */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(16,13,10,0.55) 0%, rgba(16,13,10,0.15) 35%, rgba(16,13,10,0.55) 78%, rgba(16,13,10,0.92) 100%)",
        }}
      />
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-mono text-xs tracking-[0.14em] text-[#f4f0e9]/30 uppercase">
        ▶ {t("videoPlaceholder")}
      </div>

      {/* Signature animated barber-pole rail, pinned left */}
      <div className="absolute top-0 left-[clamp(18px,5vw,54px)] z-[2] h-full w-[9px]">
        <div className="pole-rail absolute inset-0" />
      </div>

      {/* Hero content, bottom-left. Left padding clears the pole rail (which
          sits at clamp(18px,5vw,54px) + 9px wide) at every viewport width. */}
      <div className="absolute bottom-0 left-0 z-[3] w-full">
        <div className="mx-auto box-border max-w-[1280px] pr-[clamp(22px,5vw,40px)] pb-[clamp(56px,9vw,86px)] pl-[clamp(46px,calc(5vw+26px),84px)]">
          <div className="mb-[26px] text-[13px] font-semibold tracking-[0.26em] text-[#f4f0e9]/70 uppercase">
            {t("heroKicker")}
          </div>
          <h1
            className="font-heading m-0 max-w-[13ch] text-[#f6f2eb]"
            style={{ textWrap: "balance" }}
          >
            {lines.map((line) => (
              <span
                key={line}
                className="block text-[clamp(40px,8.5vw,116px)] leading-[0.94] font-bold tracking-[-0.01em] whitespace-nowrap"
              >
                {line}.
              </span>
            ))}
          </h1>
          <div className="mt-10 flex flex-wrap items-center gap-[22px]">
            <Link
              href="/book"
              className="inline-flex items-center gap-[10px] rounded-[2px] bg-[#f4f0e9] px-[30px] py-[17px] text-sm font-bold tracking-[0.04em] text-[var(--ink)] transition-colors hover:bg-white"
            >
              {t("heroCta")} <span className="text-base">→</span>
            </Link>
            <Link
              href="/#services"
              className="border-b border-[#f4f0e9]/30 pb-[3px] text-sm font-semibold tracking-[0.04em] text-[#f4f0e9]/85 transition-colors hover:text-[#f4f0e9]"
            >
              {t("heroSecondary")}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
