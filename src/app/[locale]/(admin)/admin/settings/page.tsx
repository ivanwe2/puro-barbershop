import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { fetchSettings } from "@/actions/admin/settings";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
  const session = await auth();
  if (!session || session.user?.role !== "super_admin") redirect("/bg/admin");

  const result = await fetchSettings();

  if ("error" in result) redirect("/bg/admin");

  return <SettingsClient initialSettings={result.settings} />;
}
