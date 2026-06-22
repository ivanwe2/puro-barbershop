import type { Metadata } from "next";
import LegalPage from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Cookie Info",
  robots: { index: true, follow: true },
};

export default async function CookieInfoPage(props: { params: Promise<{ locale: string }> }) {
  return <LegalPage params={props.params} contentPath="cookie-info" />;
}
