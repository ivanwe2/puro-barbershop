import type { Metadata } from "next";
import LegalPage from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  robots: { index: true, follow: true },
};

export default async function PrivacyPage(props: { params: Promise<{ locale: string }> }) {
  return <LegalPage params={props.params} contentPath="privacy" />;
}
