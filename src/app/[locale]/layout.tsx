import type { ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Toaster } from "@/components/ui/sonner";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";

export default async function LocaleLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <Header />
      <main className="flex min-h-[calc(100vh-4rem)] flex-1">{children}</main>
      <Footer />
      <Toaster />
    </NextIntlClientProvider>
  );
}
