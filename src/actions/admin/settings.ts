"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const settingsSchema = z.object({
  bufferMinutes: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(0).max(60)),
  cancellationWindowHours: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .pipe(z.number().int().min(1).max(168)),
  bookingHorizonDays: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .pipe(z.number().int().min(1).max(365)),
  slotGranularityMinutes: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .pipe(z.number().int().min(5).max(60)),
  shopEmail: z.string().email().max(255),
  shopPhone: z.string().min(7).max(30),
});

export async function fetchSettings() {
  const session = await auth();
  if (!session || session.user?.role !== "super_admin") return { error: "forbidden" } as const;

  const rows = await db.select().from(settings);

  const settingsObj: Record<string, string> = {};
  rows.forEach((r) => {
    settingsObj[r.key] = r.value;
  });

  return { settings: settingsObj } as const;
}

export async function updateSettings(formData: FormData) {
  const session = await auth();
  if (!session || session.user?.role !== "super_admin") return { error: "forbidden" } as const;

  const parsed = settingsSchema.safeParse({
    bufferMinutes: formData.get("bufferMinutes") as string,
    cancellationWindowHours: formData.get("cancellationWindowHours") as string,
    bookingHorizonDays: formData.get("bookingHorizonDays") as string,
    slotGranularityMinutes: formData.get("slotGranularityMinutes") as string,
    shopEmail: formData.get("shopEmail") as string,
    shopPhone: formData.get("shopPhone") as string,
  });

  if (!parsed.success) {
    return { error: "validation", messages: parsed.error.flatten().fieldErrors } as const;
  }

  const {
    bufferMinutes,
    cancellationWindowHours,
    bookingHorizonDays,
    slotGranularityMinutes,
    shopEmail,
    shopPhone,
  } = parsed.data;
  const now = new Date();

  const updates = [
    { key: "buffer_minutes", value: String(bufferMinutes), updatedAt: now },
    { key: "cancellation_window_hours", value: String(cancellationWindowHours), updatedAt: now },
    { key: "booking_horizon_days", value: String(bookingHorizonDays), updatedAt: now },
    { key: "slot_granularity_minutes", value: String(slotGranularityMinutes), updatedAt: now },
    { key: "shop_email", value: shopEmail, updatedAt: now },
    { key: "shop_phone", value: shopPhone, updatedAt: now },
  ];

  for (const update of updates) {
    const [existing] = await db.select().from(settings).where(eq(settings.key, update.key));
    if (existing) {
      await db
        .update(settings)
        .set({ value: update.value, updatedAt: update.updatedAt })
        .where(eq(settings.key, update.key));
    } else {
      await db
        .insert(settings)
        .values({ key: update.key, value: update.value, updatedAt: update.updatedAt });
    }
  }

  revalidatePath("/admin/settings");
  revalidatePath("/[locale]", "layout");

  return { success: true } as const;
}
