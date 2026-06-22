"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { bookings } from "@/db/schema";
import { verifyCancellationToken } from "@/lib/booking/tokens";
import { sendCancellationEmail } from "@/lib/email";
import { format } from "date-fns";

type CancelBookingResult = { success: true } | { success: false; error: "cannotCancel" };

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

    if (hoursUntil < 24) {
      return { success: false, error: "cannotCancel" };
    }

    await db
      .update(bookings)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(eq(bookings.id, booking.id));

    const dateStr = format(booking.startDatetime, "EEEE, MMMM d, yyyy");
    const timeStr = format(booking.startDatetime, "HH:mm");

    sendCancellationEmail({
      to: booking.customerEmail,
      name: booking.customerName,
      date: dateStr,
      time: timeStr,
      serviceName: "—",
      address: "—",
      phone: "—",
    }).catch((err) => {
      console.error("[cancel] Failed to send cancellation email:", err);
    });

    return { success: true };
  } catch {
    return { success: false, error: "cannotCancel" };
  }
}
