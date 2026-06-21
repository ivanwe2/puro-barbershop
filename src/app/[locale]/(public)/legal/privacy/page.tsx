import LegalPage from "@/components/legal/LegalPage";

export default async function PrivacyPage(props: { params: Promise<{ locale: string }> }) {
  return <LegalPage params={props.params} contentPath="privacy" />;
}
