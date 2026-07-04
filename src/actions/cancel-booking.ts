"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { bookings, settings } from "@/db/schema";
import { verifyCancellationToken } from "@/lib/booking/tokens";
import { sendCancellationEmail } from "@/lib/email";
import { sofiaLongDate, sofiaTime } from "@/lib/datetime";

type CancelBookingResult =
  | { success: true }
  | { success: false; error: "cannotCancel" }
  | { success: false; error: "tooLate"; windowHours: number };

export async function cancelBooking(token: string): Promise<CancelBookingResult> {
  try {
    const rows = await db.select().from(bookings).where(eq(bookings.cancellationToken, token));

    const booking = rows.find((b) => b.cancellationToken === token);

    if (!booking) {
      return { success: false, error: "cannotCancel" };
    }

    if (booking.status === "cancelled") {
      return { success: false, error: "cannotCancel" };
    }

    if (!verifyCancellationToken(token, booking.id)) {
      return { success: false, error: "cannotCancel" };
    }

    const now = new Date();
    const hoursUntil = (booking.startDatetime.getTime() - now.getTime()) / 3600000;

    // Respect the admin-configured cancellation window (falls back to 24h).
    const [windowSetting] = await db
      .select({ value: settings.value })
      .from(settings)
      .where(eq(settings.key, "cancellation_window_hours"));
    const windowHours = windowSetting ? parseInt(windowSetting.value, 10) : 24;

    if (hoursUntil < windowHours) {
      return { success: false, error: "tooLate", windowHours };
    }

    await db
      .update(bookings)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(eq(bookings.id, booking.id));

    const dateStr = sofiaLongDate(booking.startDatetime, booking.locale === "bg" ? "bg" : "en");
    const timeStr = sofiaTime(booking.startDatetime);

    sendCancellationEmail({
      to: booking.customerEmail,
      name: booking.customerName,
      date: dateStr,
      time: timeStr,
      serviceName: "—",
      address: "—",
      phone: "—",
      locale: booking.locale === "bg" ? "bg" : "en",
    }).catch((err) => {
      console.error("[cancel] Failed to send cancellation email:", err);
    });

    return { success: true };
  } catch {
    return { success: false, error: "cannotCancel" };
  }
}
