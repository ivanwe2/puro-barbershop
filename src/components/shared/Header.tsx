"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/bg", label: "Начало", locale: "bg" },
  { href: "/bg/services", label: "Услуги", locale: "bg" },
  { href: "/bg/gallery", label: "Галерия", locale: "bg" },
  { href: "/bg/location", label: "Местоположение", locale: "bg" },
  { href: "/bg/book", label: "Запази час", locale: "bg" },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="border-border bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/bg" className="flex items-center gap-2">
          <Image
            src="/logo.svg"
            alt="Puro Barbershop"
            width={40}
            height={40}
            className="h-8 w-auto"
          />
          <span className="font-heading text-foreground text-xl font-semibold tracking-wide">
            PURO
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex md:items-center md:gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-muted-foreground hover:text-foreground text-sm font-medium transition-colors",
                link.label === "Запази час" &&
                  "border-accent text-accent hover:bg-accent hover:text-accent-foreground rounded-md border px-3 py-1.5",
              )}
            >
              {link.label}
            </Link>
          ))}
          <button
            type="button"
            className="border-border text-muted-foreground hover:text-foreground rounded-md border px-2 py-1 text-xs font-medium transition-colors"
            aria-label="Switch to English"
          >
            EN
          </button>
        </nav>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="border-border flex h-10 w-10 items-center justify-center rounded-md border md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="4" x2="20" y1="12" y2="12" />
              <line x1="4" x2="20" y1="6" y2="6" />
              <line x1="4" x2="20" y1="18" y2="18" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-border border-t md:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4 sm:px-6 lg:px-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "text-muted-foreground hover:bg-muted hover:text-foreground rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  link.label === "Запази час" &&
                    "border-accent text-accent hover:bg-accent hover:text-accent-foreground border",
                )}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 flex items-center justify-between px-3 py-2">
              <button
                type="button"
                className="border-border text-muted-foreground hover:text-foreground rounded-md border px-3 py-1.5 text-xs font-medium transition-colors"
              >
                EN
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
