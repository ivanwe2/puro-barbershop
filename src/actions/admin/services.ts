"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { services } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const serviceSchema = z.object({
  nameBg: z.string().min(1).max(100),
  nameEn: z.string().min(1).max(100),
  descriptionBg: z.string().max(2000).optional(),
  descriptionEn: z.string().max(2000).optional(),
  durationMinutes: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().positive()),
  priceBgn: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/)
    .transform(Number)
    .pipe(z.number().nonnegative()),
  displayOrder: z.string().regex(/^\d+$/).transform(Number).default(0),
  active: z.coerce.boolean().default(true),
});

export async function fetchServicesList() {
  const session = await auth();
  if (!session || session.user?.role !== "super_admin") return { error: "forbidden" } as const;

  const rows = await db.select().from(services).orderBy(asc(services.displayOrder));

  return { services: rows } as const;
}

export async function createService(formData: FormData) {
  const session = await auth();
  if (!session || session.user?.role !== "super_admin") return { error: "forbidden" } as const;

  const parsed = serviceSchema.safeParse({
    nameBg: formData.get("nameBg") as string,
    nameEn: formData.get("nameEn") as string,
    descriptionBg: (formData.get("descriptionBg") as string) || undefined,
    descriptionEn: (formData.get("descriptionEn") as string) || undefined,
    durationMinutes: formData.get("durationMinutes") as string,
    priceBgn: formData.get("priceBgn") as string,
    displayOrder: formData.get("displayOrder") as string,
    active: formData.get("active") === "on",
  });

  if (!parsed.success) {
    return { error: "validation", messages: parsed.error.flatten().fieldErrors } as const;
  }

  const {
    nameBg,
    nameEn,
    descriptionBg,
    descriptionEn,
    durationMinutes,
    priceBgn,
    displayOrder,
    active,
  } = parsed.data;

  const result = await db
    .insert(services)
    .values({
      nameBg,
      nameEn,
      descriptionBg: descriptionBg ?? null,
      descriptionEn: descriptionEn ?? null,
      durationMinutes,
      priceBgn: String(priceBgn),
      displayOrder,
      active,
    })
    .returning();

  revalidatePath("/admin/services");
  revalidatePath("/[locale]", "layout");

  return { success: true, id: result[0]?.id ?? 0 } as const;
}

export async function updateService(id: number, formData: FormData) {
  const session = await auth();
  if (!session || session.user?.role !== "super_admin") return { error: "forbidden" } as const;

  const parsed = serviceSchema.safeParse({
    nameBg: formData.get("nameBg") as string,
    nameEn: formData.get("nameEn") as string,
    descriptionBg: (formData.get("descriptionBg") as string) || undefined,
    descriptionEn: (formData.get("descriptionEn") as string) || undefined,
    durationMinutes: formData.get("durationMinutes") as string,
    priceBgn: formData.get("priceBgn") as string,
    displayOrder: formData.get("displayOrder") as string,
    active: formData.get("active") === "on",
  });

  if (!parsed.success) {
    return { error: "validation", messages: parsed.error.flatten().fieldErrors } as const;
  }

  const {
    nameBg,
    nameEn,
    descriptionBg,
    descriptionEn,
    durationMinutes,
    priceBgn,
    displayOrder,
    active,
  } = parsed.data;

  await db
    .update(services)
    .set({
      nameBg,
      nameEn,
      descriptionBg: descriptionBg ?? null,
      descriptionEn: descriptionEn ?? null,
      durationMinutes,
      priceBgn: String(priceBgn),
      displayOrder,
      active,
      updatedAt: new Date(),
    })
    .where(eq(services.id, id));

  revalidatePath("/admin/services");
  revalidatePath("/[locale]", "layout");

  return { success: true } as const;
}

export async function deleteService(id: number) {
  const session = await auth();
  if (!session || session.user?.role !== "super_admin") return { error: "forbidden" } as const;

  await db.delete(services).where(eq(services.id, id));

  revalidatePath("/admin/services");
  revalidatePath("/[locale]", "layout");

  return { success: true } as const;
}
