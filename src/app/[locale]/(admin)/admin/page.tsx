import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { bookings, barbers, services, timeOff } from "@/db/schema";
import { and, eq, gte, lte, sql } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/lib/i18n/routing";
import { Button } from "@/components/ui/button";

function toSofiaLocal(date: Date): Date {
  return new Date(date.toLocaleString("en-US", { timeZone: "Europe/Sofia" }));
}

function getTodaySofia(): { start: Date; end: Date } {
  const now = new Date();
  const sofiaStr = now.toLocaleString("en-US", { timeZone: "Europe/Sofia" });
  const local = new Date(sofiaStr);
  const start = new Date(local);
  start.setHours(0, 0, 0, 0);
  const end = new Date(local);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function getWeekSofia(): { start: Date; end: Date } {
  const now = new Date();
  const sofiaStr = now.toLocaleString("en-US", { timeZone: "Europe/Sofia" });
  const local = new Date(sofiaStr);
  const day = local.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(local);
  monday.setDate(monday.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { start: monday, end: sunday };
}

async function getTodayBookings(barberId?: number) {
  const { start, end } = getTodaySofia();
  const baseWhere = and(
    eq(bookings.status, "confirmed"),
    gte(bookings.startDatetime, start),
    lte(bookings.startDatetime, end),
  );

  const select = {
    id: bookings.id,
    customerName: bookings.customerName,
    customerEmail: bookings.customerEmail,
    startDatetime: bookings.startDatetime,
    serviceName: services.nameBg,
    barberName: barbers.nameBg,
  };

  if (barberId) {
    return db
      .select(select)
      .from(bookings)
      .leftJoin(services, eq(bookings.serviceId, services.id))
      .leftJoin(barbers, eq(bookings.barberId, barbers.id))
      .where(and(baseWhere, eq(bookings.barberId, barberId)))
      .orderBy(sql`start_datetime`);
  }

  return db
    .select(select)
    .from(bookings)
    .leftJoin(services, eq(bookings.serviceId, services.id))
    .leftJoin(barbers, eq(bookings.barberId, barbers.id))
    .where(baseWhere)
    .orderBy(sql`start_datetime`);
}

async function getWeekStats(barberId?: number) {
  const { start, end } = getWeekSofia();
  const baseWhere = and(gte(bookings.startDatetime, start), lte(bookings.startDatetime, end));

  const select = {
    confirmed: sql<number>`count(*) filter (where status = 'confirmed')`.mapWith(Number),
    cancelled: sql<number>`count(*) filter (where status = 'cancelled')`.mapWith(Number),
    completed: sql<number>`count(*) filter (where status = 'completed')`.mapWith(Number),
    noShow: sql<number>`count(*) filter (where status = 'no_show')`.mapWith(Number),
  };

  if (barberId) {
    return db
      .select(select)
      .from(bookings)
      .where(and(baseWhere, eq(bookings.barberId, barberId)));
  }

  return db.select(select).from(bookings).where(baseWhere);
}

async function getUpcomingTimeOff(barberId?: number) {
  const now = new Date();
  const baseWhere = gte(timeOff.endDatetime, now);

  const select = {
    id: timeOff.id,
    barberName: barbers.nameBg,
    startDatetime: timeOff.startDatetime,
    endDatetime: timeOff.endDatetime,
    reason: timeOff.reason,
  };

  if (barberId) {
    return db
      .select(select)
      .from(timeOff)
      .leftJoin(barbers, eq(timeOff.barberId, barbers.id))
      .where(and(baseWhere, eq(timeOff.barberId, barberId)))
      .orderBy(sql`start_datetime`)
      .limit(5);
  }

  return db
    .select(select)
    .from(timeOff)
    .leftJoin(barbers, eq(timeOff.barberId, barbers.id))
    .where(baseWhere)
    .orderBy(sql`start_datetime`)
    .limit(5);
}

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/bg/admin/login");
  }

  const isSuperAdmin = session.user?.role === "super_admin";
  const barberId = isSuperAdmin ? undefined : session.user?.barberId;

  const t = await getTranslations("admin");

  const [todayBookings, weekStats, upcomingTimeOff] = await Promise.all([
    getTodayBookings(barberId),
    getWeekStats(barberId),
    getUpcomingTimeOff(barberId),
  ]);

  const stats = weekStats[0] ?? { confirmed: 0, cancelled: 0, completed: 0, noShow: 0 };

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-foreground text-3xl">{t("dashboard")}</h1>

      {/* Today's Bookings */}
      <Card>
        <CardHeader>
          <CardTitle>{t("todayBookings")}</CardTitle>
        </CardHeader>
        <CardContent>
          {todayBookings.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {isSuperAdmin ? t("noBookingsToday") : t("noBookingsTodayBarber")}
            </p>
          ) : (
            <div className="space-y-3">
              {todayBookings.map((b) => (
                <div key={b.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-1">
                    <p className="text-foreground text-sm font-medium">{b.customerName}</p>
                    <p className="text-muted-foreground text-xs">{b.serviceName}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-foreground text-sm">
                      {toSofiaLocal(b.startDatetime).toLocaleTimeString("bg-BG", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <p className="text-muted-foreground text-xs">{b.barberName}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Week Stats */}
      <Card>
        <CardHeader>
          <CardTitle>{t("weekStats")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs">{t("statusConfirmed")}</p>
              <p className="text-foreground text-2xl font-semibold">{stats.confirmed}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs">{t("statusCompleted")}</p>
              <p className="text-foreground text-2xl font-semibold">{stats.completed}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs">{t("statusCancelled")}</p>
              <p className="text-foreground text-2xl font-semibold">{stats.cancelled}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs">{t("statusNoShow")}</p>
              <p className="text-foreground text-2xl font-semibold">{stats.noShow}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Time Off */}
      <Card>
        <CardHeader>
          <CardTitle>{t("upcomingTimeOff")}</CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingTimeOff.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t("noTimeOff")}</p>
          ) : (
            <div className="space-y-3">
              {upcomingTimeOff.map((to) => (
                <div
                  key={to.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="space-y-1">
                    <p className="text-foreground text-sm font-medium">{to.barberName}</p>
                    <p className="text-muted-foreground text-xs">
                      {toSofiaLocal(to.startDatetime).toLocaleDateString("bg-BG", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}{" "}
                      —{" "}
                      {toSofiaLocal(to.endDatetime).toLocaleDateString("bg-BG", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                    {to.reason && <p className="text-muted-foreground text-xs">{to.reason}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle>{t("quickLinks")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/schedule">
              <Button variant="outline">{t("schedule")}</Button>
            </Link>
            <Link href="/admin/time-off">
              <Button variant="outline">{t("timeOff")}</Button>
            </Link>
            {isSuperAdmin && (
              <>
                <Link href="/admin/barbers">
                  <Button variant="outline">{t("barbers")}</Button>
                </Link>
                <Link href="/admin/services">
                  <Button variant="outline">{t("services")}</Button>
                </Link>
                <Link href="/admin/settings">
                  <Button variant="outline">{t("settings")}</Button>
                </Link>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
