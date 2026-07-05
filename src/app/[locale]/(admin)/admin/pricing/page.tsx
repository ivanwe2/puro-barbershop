import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { fetchPricingMatrix } from "@/actions/admin/pricing";
import PricingClient from "./PricingClient";

export default async function PricingPage() {
  const session = await auth();
  if (!session || session.user?.role !== "super_admin") redirect("/bg/admin");

  const result = await fetchPricingMatrix();
  if ("error" in result) redirect("/bg/admin");

  return (
    <PricingClient
      services={result.services}
      barbers={result.barbers}
      overrides={result.overrides}
    />
  );
}
