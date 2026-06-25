import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import ScheduleClient from "./ScheduleClient";
import {
  fetchScheduleBookings,
  fetchBarbers,
  fetchTimeOff,
  fetchServices,
} from "@/actions/admin/schedule";

export default async function SchedulePage() {
  const session = await auth();
  if (!session) redirect("/bg/admin/login");

  // Compute week range
  const now = new Date();
  const sofiaStr = now.toLocaleString("en-US", { timeZone: "Europe/Sofia" });
  const local = new Date(sofiaStr);
  const day = local.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const weekStart = new Date(local);
  weekStart.setDate(weekStart.getDate() + diffToMonday);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const isSuperAdmin = session.user?.role === "super_admin";
  const barberId = isSuperAdmin ? undefined : session.user?.barberId;

  const [bookingsResult, barbersResult, timeOffResult, servicesResult] = await Promise.all([
    fetchScheduleBookings({
      ...(barberId ? { barberId } : {}),
      startDate: format(weekStart, "yyyy-MM-dd"),
      endDate: format(weekEnd, "yyyy-MM-dd"),
    }),
    fetchBarbers(),
    fetchTimeOff({
      startDate: format(weekStart, "yyyy-MM-dd"),
      endDate: format(weekEnd, "yyyy-MM-dd"),
    }),
    fetchServices(),
  ]);

  return (
    <ScheduleClient
      initialBookings={"error" in bookingsResult ? [] : bookingsResult.bookings}
      initialBarbers={"error" in barbersResult ? [] : barbersResult.barbers}
      initialTimeOff={"error" in timeOffResult ? [] : timeOffResult.timeOff}
      initialServices={"error" in servicesResult ? [] : servicesResult.services}
      isSuperAdmin={isSuperAdmin}
      userBarberId={isSuperAdmin ? undefined : session.user?.barberId}
    />
  );
}

function format(date: Date, fmt: string): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  return fmt.replace("yyyy", String(year)).replace("MM", month).replace("dd", day);
}
