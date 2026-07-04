import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { fetchBarbersList } from "@/actions/admin/barbers";
import BarbersClient from "./BarbersClient";

export default async function BarbersPage() {
  const session = await auth();
  if (!session || session.user?.role !== "super_admin") redirect("/bg/admin");

  const result = await fetchBarbersList();

  if ("error" in result) redirect("/bg/admin");

  return <BarbersClient initialBarbers={result.barbers} />;
}
