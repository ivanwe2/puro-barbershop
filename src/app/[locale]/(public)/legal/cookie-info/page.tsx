import LegalPage from "@/components/legal/LegalPage";

export default async function CookieInfoPage(props: { params: Promise<{ locale: string }> }) {
  return <LegalPage params={props.params} contentPath="cookie-info" />;
}
