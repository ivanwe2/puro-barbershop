import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { db } from "@/db";
import { barbers } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { fetchTimeOffEntries } from "@/actions/admin/time-off";
import TimeOffClient from "./TimeOffClient";

export default async function TimeOffPage() {
  const session = await auth();
  if (!session) redirect("/bg/admin/login");

  const t = await getTranslations("admin");
  const isSuperAdmin = session.user?.role === "super_admin";

  const entriesResult = await fetchTimeOffEntries();
  const entries = "error" in entriesResult ? [] : entriesResult.entries;

  const barbersList = isSuperAdmin
    ? await db
        .select({ id: barbers.id, nameBg: barbers.nameBg })
        .from(barbers)
        .where(eq(barbers.active, true))
        .orderBy(asc(barbers.displayOrder))
    : [];

  const barberId = isSuperAdmin ? undefined : session.user?.barberId;

  return (
    <TimeOffClient
      t={t}
      initialEntries={entries}
      initialBarbers={barbersList}
      isSuperAdmin={isSuperAdmin}
      {...(barberId ? { barberId } : {})}
    />
  );
}
