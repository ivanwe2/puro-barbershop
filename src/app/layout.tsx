import type { Metadata } from "next";
import {
  Bodoni_Moda,
  Hanken_Grotesk,
  Pirata_One,
  Cormorant_Garamond,
  Inter,
} from "next/font/google";
import { cn } from "@/lib/utils";
import "./globals.css";

// Display / headings (editorial high-contrast serif). Latin only — no Cyrillic
// subset exists for this family, so Bulgarian glyphs fall through to Cormorant.
const bodoni = Bodoni_Moda({
  subsets: ["latin", "latin-ext"],
  variable: "--font-bodoni",
  display: "swap",
});

// Body / UI sans. Cyrillic glyphs fall through to Inter (full Cyrillic support).
const hanken = Hanken_Grotesk({
  subsets: ["latin", "latin-ext"],
  variable: "--font-hanken",
  display: "swap",
});

// Blackletter wordmark — used for "PURO" only (Latin).
const pirata = Pirata_One({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-pirata",
  display: "swap",
});

// Cyrillic fallback for headings (Bodoni Moda has no Cyrillic).
const cormorant = Cormorant_Garamond({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
});

// Cyrillic fallback for body (Hanken Grotesk lacks base Cyrillic).
const inter = Inter({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Puro Barbershop — Precision · Confidence · Clean Look",
  description: "Прецизност · Увереност · Стил. Запази час в Puro Barbershop, Пловдив.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="bg"
      className={cn(
        "h-full antialiased",
        bodoni.variable,
        hanken.variable,
        pirata.variable,
        cormorant.variable,
        inter.variable,
      )}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
