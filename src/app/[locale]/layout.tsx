import type { ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";

export default function LocaleLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <main className="flex min-h-[calc(100vh-4rem)] flex-1">{children}</main>
      <Footer />
      <Toaster />
    </>
  );
}
