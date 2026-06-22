import { NextResponse } from "next/server";
import { db } from "@/db";
import { bookings, barbers, services } from "@/db/schema";
import { and, eq, gte, lte } from "drizzle-orm";
import { env } from "@/lib/env";
import { sendReminder } from "@/lib/email";

const ADDRESS_BG = "Бул. Христо Ботев 114, Пловдив, България";
const ADDRESS_EN = "114 Hristo Botev Blvd, Plovdiv, Bulgaria";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");

  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const twentyThreeHoursFromNow = new Date(now.getTime() + 23 * 60 * 60 * 1000);
    const twentyFiveHoursFromNow = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    const pendingReminders = await db
      .select({
        id: bookings.id,
        customerName: bookings.customerName,
        customerEmail: bookings.customerEmail,
        startDatetime: bookings.startDatetime,
        serviceId: bookings.serviceId,
        barberId: bookings.barberId,
        locale: bookings.locale,
        cancellationUrl: bookings.cancellationToken,
      })
      .from(bookings)
      .where(
        and(
          eq(bookings.status, "confirmed"),
          eq(bookings.reminderSent, false),
          gte(bookings.startDatetime, twentyThreeHoursFromNow),
          lte(bookings.startDatetime, twentyFiveHoursFromNow),
        ),
      );

    let sent = 0;

    for (const booking of pendingReminders) {
      try {
        const [barber] = await db
          .select({ nameBg: barbers.nameBg, nameEn: barbers.nameEn })
          .from(barbers)
          .where(eq(barbers.id, booking.barberId));

        const [service] = await db
          .select({ nameBg: services.nameBg, nameEn: services.nameEn })
          .from(services)
          .where(eq(services.id, booking.serviceId));

        const serviceName =
          booking.locale === "bg" ? (service?.nameBg ?? "") : (service?.nameEn ?? "");
        const barberName =
          booking.locale === "bg" ? (barber?.nameBg ?? "") : (barber?.nameEn ?? "");
        const address = booking.locale === "bg" ? ADDRESS_BG : ADDRESS_EN;

        await sendReminder({
          to: booking.customerEmail,
          name: booking.customerName,
          date: booking.startDatetime.toLocaleDateString(
            booking.locale === "bg" ? "bg-BG" : "en-US",
            { weekday: "long", year: "numeric", month: "long", day: "numeric" },
          ),
          time: booking.startDatetime.toLocaleTimeString(
            booking.locale === "bg" ? "bg-BG" : "en-US",
            { hour: "2-digit", minute: "2-digit" },
          ),
          serviceName,
          barberName,
          cancellationLink: `${env.AUTH_URL}/${booking.locale}/book/cancel/${booking.cancellationUrl}`,
          address,
        });

        await db
          .update(bookings)
          .set({ reminderSent: true, updatedAt: new Date() })
          .where(eq(bookings.id, booking.id));

        sent++;
      } catch (err) {
        console.error(`Failed to send reminder for booking ${booking.id}:`, err);
      }
    }

    return NextResponse.json({ success: true, sent });
  } catch (err) {
    console.error("Reminder cron error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
