"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { barbers, services, barberServicePrices } from "@/db/schema";
import { and, eq, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

/** Services, barbers, and current overrides for the admin pricing matrix. */
export async function fetchPricingMatrix() {
  const session = await auth();
  if (!session || session.user?.role !== "super_admin") return { error: "forbidden" } as const;

  const [serviceRows, barberRows, overrideRows] = await Promise.all([
    db
      .select({
        id: services.id,
        nameBg: services.nameBg,
        nameEn: services.nameEn,
        priceBgn: services.priceBgn,
      })
      .from(services)
      .orderBy(asc(services.displayOrder)),
    db
      .select({ id: barbers.id, nameBg: barbers.nameBg, nameEn: barbers.nameEn })
      .from(barbers)
      .orderBy(asc(barbers.displayOrder)),
    db
      .select({
        barberId: barberServicePrices.barberId,
        serviceId: barberServicePrices.serviceId,
        priceEur: barberServicePrices.priceEur,
      })
      .from(barberServicePrices),
  ]);

  return { services: serviceRows, barbers: barberRows, overrides: overrideRows } as const;
}

const saveSchema = z.object({
  entries: z.array(
    z.object({
      barberId: z.number().int().positive(),
      serviceId: z.number().int().positive(),
      // Empty string clears the override (barber inherits the base price).
      priceEur: z.union([z.string().regex(/^\d+(\.\d{1,2})?$/), z.literal("")]),
    }),
  ),
});

/**
 * Upsert the per-barber price overrides. A blank price deletes the override so
 * that barber falls back to the service's shared base price.
 */
export async function savePricing(input: unknown) {
  const session = await auth();
  if (!session || session.user?.role !== "super_admin") return { error: "forbidden" } as const;

  const parsed = saveSchema.safeParse(input);
  if (!parsed.success) return { error: "validation" } as const;

  const now = new Date();

  for (const { barberId, serviceId, priceEur } of parsed.data.entries) {
    if (priceEur === "") {
      await db
        .delete(barberServicePrices)
        .where(
          and(
            eq(barberServicePrices.barberId, barberId),
            eq(barberServicePrices.serviceId, serviceId),
          ),
        );
      continue;
    }

    await db
      .insert(barberServicePrices)
      .values({ barberId, serviceId, priceEur, updatedAt: now })
      .onConflictDoUpdate({
        target: [barberServicePrices.barberId, barberServicePrices.serviceId],
        set: { priceEur, updatedAt: now },
      });
  }

  revalidatePath("/admin/pricing");
  // Prices show on the public site, so refresh the marketing pages too.
  revalidatePath("/[locale]", "layout");

  return { success: true } as const;
}
