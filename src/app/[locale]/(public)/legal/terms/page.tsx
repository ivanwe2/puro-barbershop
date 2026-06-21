import LegalPage from "@/components/legal/LegalPage";

export default async function TermsPage(props: { params: Promise<{ locale: string }> }) {
  return <LegalPage params={props.params} contentPath="terms" />;
}
