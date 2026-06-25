import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { fetchServicesList } from "@/actions/admin/services";
import ServicesClient from "./ServicesClient";

export default async function ServicesPage() {
  const session = await auth();
  if (!session || session.user?.role !== "super_admin") redirect("/bg/admin");

  const result = await fetchServicesList();

  if ("error" in result) redirect("/bg/admin");

  return <ServicesClient initialServices={result.services} />;
}
