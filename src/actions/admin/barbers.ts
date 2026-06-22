"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { barbers, workingHours } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const barberSchema = z.object({
  nameBg: z.string().min(1).max(100),
  nameEn: z.string().min(1).max(100),
  bioBg: z.string().max(2000).optional(),
  bioEn: z.string().max(2000).optional(),
  photoUrl: z.string().url().optional().or(z.literal("")),
  displayOrder: z.string().regex(/^\d+$/).transform(Number).default(0),
  active: z.coerce.boolean().default(true),
});

export async function fetchBarbersList() {
  const session = await auth();
  if (!session || session.user?.role !== "super_admin") return { error: "forbidden" } as const;

  const rows = await db
    .select({
      id: barbers.id,
      nameBg: barbers.nameBg,
      nameEn: barbers.nameEn,
      bioBg: barbers.bioBg,
      bioEn: barbers.bioEn,
      photoUrl: barbers.photoUrl,
      displayOrder: barbers.displayOrder,
      active: barbers.active,
      userId: barbers.userId,
    })
    .from(barbers)
    .orderBy(asc(barbers.displayOrder));

  return { barbers: rows } as const;
}

export async function createBarber(formData: FormData) {
  const session = await auth();
  if (!session || session.user?.role !== "super_admin") return { error: "forbidden" } as const;

  const parsed = barberSchema.safeParse({
    nameBg: formData.get("nameBg") as string,
    nameEn: formData.get("nameEn") as string,
    bioBg: (formData.get("bioBg") as string) || undefined,
    bioEn: (formData.get("bioEn") as string) || undefined,
    photoUrl: (formData.get("photoUrl") as string) || undefined,
    displayOrder: formData.get("displayOrder") as string,
    active: formData.get("active") === "on",
  });

  if (!parsed.success) {
    return { error: "validation", messages: parsed.error.flatten().fieldErrors } as const;
  }

  const { nameBg, nameEn, bioBg, bioEn, photoUrl, displayOrder, active } = parsed.data;

  const result = await db
    .insert(barbers)
    .values({
      nameBg,
      nameEn,
      bioBg: bioBg ?? null,
      bioEn: bioEn ?? null,
      photoUrl: photoUrl ?? null,
      displayOrder,
      active,
    })
    .returning();

  const barberId = result[0]?.id;

  if (barberId) {
    // Set default working hours for the new barber
    const defaultHours = [
      { dayOfWeek: 1, startTime: "09:00", endTime: "19:00" },
      { dayOfWeek: 2, startTime: "09:00", endTime: "19:00" },
      { dayOfWeek: 3, startTime: "09:00", endTime: "19:00" },
      { dayOfWeek: 4, startTime: "09:00", endTime: "19:00" },
      { dayOfWeek: 5, startTime: "09:00", endTime: "19:00" },
      { dayOfWeek: 6, startTime: "09:00", endTime: "17:00" },
    ];

    await db.insert(workingHours).values(
      defaultHours.map((h) => ({
        barberId,
        dayOfWeek: h.dayOfWeek,
        startTime: h.startTime,
        endTime: h.endTime,
        active: true,
      })),
    );
  }

  revalidatePath("/admin/barbers");
  revalidatePath("/[locale]", "layout");

  return { success: true, id: barberId ?? 0 } as const;
}

export async function updateBarber(id: number, formData: FormData) {
  const session = await auth();
  if (!session || session.user?.role !== "super_admin") return { error: "forbidden" } as const;

  const parsed = barberSchema.safeParse({
    nameBg: formData.get("nameBg") as string,
    nameEn: formData.get("nameEn") as string,
    bioBg: (formData.get("bioBg") as string) || undefined,
    bioEn: (formData.get("bioEn") as string) || undefined,
    photoUrl: (formData.get("photoUrl") as string) || undefined,
    displayOrder: formData.get("displayOrder") as string,
    active: formData.get("active") === "on",
  });

  if (!parsed.success) {
    return { error: "validation", messages: parsed.error.flatten().fieldErrors } as const;
  }

  const { nameBg, nameEn, bioBg, bioEn, photoUrl, displayOrder, active } = parsed.data;

  await db
    .update(barbers)
    .set({
      nameBg,
      nameEn,
      bioBg: bioBg ?? null,
      bioEn: bioEn ?? null,
      photoUrl: photoUrl ?? null,
      displayOrder,
      active,
      updatedAt: new Date(),
    })
    .where(eq(barbers.id, id));

  revalidatePath("/admin/barbers");
  revalidatePath("/[locale]", "layout");

  return { success: true } as const;
}

export async function deleteBarber(id: number) {
  const session = await auth();
  if (!session || session.user?.role !== "super_admin") return { error: "forbidden" } as const;

  await db.delete(barbers).where(eq(barbers.id, id));

  revalidatePath("/admin/barbers");
  revalidatePath("/[locale]", "layout");

  return { success: true } as const;
}
