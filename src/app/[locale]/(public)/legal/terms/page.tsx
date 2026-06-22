import type { Metadata } from "next";
import LegalPage from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Service",
  robots: { index: true, follow: true },
};

export default async function TermsPage(props: { params: Promise<{ locale: string }> }) {
  return <LegalPage params={props.params} contentPath="terms" />;
}
