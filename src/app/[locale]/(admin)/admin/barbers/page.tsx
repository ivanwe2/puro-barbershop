import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { fetchBarbersList } from "@/actions/admin/barbers";
import BarbersClient from "./BarbersClient";

export default async function BarbersPage() {
  const session = await auth();
  if (!session || session.user?.role !== "super_admin") redirect("/bg/admin");

  const t = await getTranslations("admin");
  const result = await fetchBarbersList();

  if ("error" in result) redirect("/bg/admin");

  return <BarbersClient t={t} initialBarbers={result.barbers} />;
}
