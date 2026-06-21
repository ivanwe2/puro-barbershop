import type { Metadata } from "next";
import { Cormorant_Garamond, Inter, Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600"],
  variable: "--font-cormorant",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600"],
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
      className={cn("h-full antialiased", cormorant.variable, inter.variable, geist.variable)}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
