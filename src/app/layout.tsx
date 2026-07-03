import type { Metadata } from "next";
import { Playfair_Display, Inter, Pirata_One } from "next/font/google";
import { cn } from "@/lib/utils";
import "./globals.css";

// Display / headings — high-contrast editorial serif with full Cyrillic, so
// Bulgarian and English render in the same face.
const playfair = Playfair_Display({
  subsets: ["latin", "latin-ext", "cyrillic"],
  variable: "--font-playfair",
  display: "swap",
});

// Body / UI sans — full Cyrillic, used for both languages.
const inter = Inter({
  subsets: ["latin", "latin-ext", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
});

// Blackletter wordmark — used for "PURO" only (Latin).
const pirata = Pirata_One({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-pirata",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Puro Barbershop",
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
      className={cn("h-full antialiased", playfair.variable, inter.variable, pirata.variable)}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
