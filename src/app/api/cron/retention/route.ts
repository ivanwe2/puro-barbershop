import { NextResponse } from "next/server";
import { db } from "@/db";
import { bookings } from "@/db/schema";
import { and, lte, sql } from "drizzle-orm";
import { env } from "@/lib/env";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");

  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Delete completed/cancelled/no_show bookings older than 12 months
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const result = await db
      .delete(bookings)
      .where(
        and(
          sql`status IN ('completed', 'cancelled', 'no_show')`,
          lte(bookings.endDatetime, twelveMonthsAgo),
        ),
      )
      .returning();

    const deletedCount = result.length;

    console.log(`[retention] Deleted ${deletedCount} old bookings`);

    return NextResponse.json({ success: true, deleted: deletedCount });
  } catch (err) {
    console.error("Retention cron error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
