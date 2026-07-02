"use client";

import { useTranslations, useLocale } from "next-intl";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Link, usePathname, useRouter } from "@/lib/i18n/routing";
import Wordmark from "@/components/shared/Wordmark";

function LocaleSwitcher({ scrolled }: { scrolled: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const currentLocale = useLocale();
  const otherLocale = currentLocale === "bg" ? "en" : "bg";

  return (
    <button
      type="button"
      onClick={() => router.replace(pathname, { locale: otherLocale })}
      className={cn(
        "rounded-[2px] border px-2 py-1 text-xs font-semibold tracking-[0.08em] uppercase transition-colors",
        scrolled
          ? "border-[var(--hairline)] text-[var(--ink)]/70 hover:border-[var(--ink)] hover:text-[var(--ink)]"
          : "border-[#f4f0e9]/40 text-[#f4f0e9]/80 hover:border-[#f4f0e9] hover:text-[#f4f0e9]",
      )}
      aria-label="Switch language"
    >
      {otherLocale.toUpperCase()}
    </button>
  );
}

export default function Header() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [scrolledPastHero, setScrolledPastHero] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Pages without a dark hero always show the solid nav.
  const scrolled = !isHome || scrolledPastHero;

  // On the homepage, detect when the hero leaves the viewport via a 1px
  // sentinel at its bottom — robust regardless of which element scrolls (§04).
  useEffect(() => {
    if (!isHome) return;
    const sentinel = document.getElementById("nav-sentinel");
    if (!sentinel || !("IntersectionObserver" in window)) {
      const onScroll = () =>
        setScrolledPastHero(window.scrollY > (window.innerHeight || 700) * 0.8);
      window.addEventListener("scroll", onScroll, { passive: true });
      const raf = requestAnimationFrame(onScroll);
      return () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("scroll", onScroll);
      };
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e) setScrolledPastHero(e.boundingClientRect.top < 80);
      },
      { rootMargin: "-79px 0px 0px 0px", threshold: [0, 1] },
    );
    io.observe(sentinel);
    return () => io.disconnect();
  }, [isHome]);

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const links = [
    { href: "/#services", label: t("services") },
    { href: "/#barbers", label: t("barbers") },
    { href: "/#gallery", label: t("gallery") },
    { href: "/#location", label: t("visit") },
  ];

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 z-50 flex h-[78px] w-full items-center transition-[background,color,border-color,box-shadow,backdrop-filter] duration-[400ms] ease-in-out",
          scrolled
            ? "border-b border-[var(--hairline)] bg-[rgba(247,244,239,0.9)] text-[var(--ink)] shadow-[0_6px_24px_rgba(21,18,14,0.06)] backdrop-blur-[14px] backdrop-saturate-[1.3]"
            : "border-b border-[#f4f0e9]/[0.14] text-[#f4f0e9] backdrop-blur-[2px]",
        )}
      >
        <div className="mx-auto flex w-full max-w-[1280px] items-center justify-between px-[clamp(20px,5vw,40px)]">
          <Link
            href="/"
            className="text-[30px] leading-none text-current"
            aria-label="Puro Barbershop"
          >
            <Wordmark />
          </Link>

          <div className="flex items-center gap-6">
            <nav className="hidden items-center gap-9 md:flex">
              {links.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-[13px] font-semibold tracking-[0.08em] text-current uppercase opacity-90 transition-opacity hover:opacity-100"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <Link
              href="/book"
              className={cn(
                "rounded-[2px] px-[22px] py-[11px] text-[13px] font-bold tracking-[0.08em] uppercase transition-colors",
                scrolled
                  ? "bg-[var(--ink)] text-[#f7f4ef] hover:bg-black"
                  : "border border-[#f4f0e9]/45 text-[#f4f0e9] hover:bg-[#f4f0e9] hover:text-[var(--ink)]",
              )}
            >
              {t("book")}
            </Link>

            <div className="hidden md:block">
              <LocaleSwitcher scrolled={scrolled} />
            </div>

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              className="-mr-2 flex h-[42px] w-[42px] flex-col items-center justify-center gap-[5px] text-current md:hidden"
            >
              <span className="block h-[2px] w-[22px] bg-current" />
              <span className="block h-[2px] w-[22px] bg-current" />
              <span className="block h-[2px] w-[22px] bg-current" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile slide-in drawer */}
      <div
        className={cn(
          "fixed inset-0 z-[60] flex flex-col bg-[var(--paper)] px-[clamp(24px,7vw,40px)] pt-[26px] pb-8 text-[var(--ink)] shadow-[-20px_0_60px_rgba(21,18,14,0.18)] transition-transform duration-[350ms] ease-[cubic-bezier(.4,0,.2,1)] md:hidden",
          menuOpen ? "translate-x-0" : "pointer-events-none translate-x-full",
        )}
      >
        <div className="flex items-center justify-between">
          <Wordmark className="text-[30px]" />
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
            className="flex h-[42px] w-[42px] items-center justify-center text-[30px] leading-none"
          >
            &times;
          </button>
        </div>
        <nav className="mt-11 flex flex-col">
          {links.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className="font-heading border-b border-[var(--hairline)] py-[14px] text-[32px] font-semibold text-[var(--ink)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto flex items-center justify-between gap-4">
          <Link
            href="/book"
            onClick={() => setMenuOpen(false)}
            className="flex-1 rounded-[2px] bg-[var(--ink)] py-[18px] text-center text-[15px] font-bold tracking-[0.04em] text-[var(--paper)]"
          >
            {t("book")} →
          </Link>
          <LocaleSwitcher scrolled={true} />
        </div>
      </div>

      {/* Spacer keeps content below the fixed nav on pages without a hero. */}
      {!isHome && <div aria-hidden className="h-[78px]" />}
    </>
  );
}
