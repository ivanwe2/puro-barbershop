"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(12).max(200),
});

type Result = { success: true } | { error: "unauthorized" | "weakPassword" | "wrongCurrent" };

/** Let the logged-in user (super-admin or barber) change their own password. */
export async function changeOwnPassword(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<Result> {
  const session = await auth();
  if (!session?.user?.id) return { error: "unauthorized" };

  const parsed = schema.safeParse(input);
  if (!parsed.success) return { error: "weakPassword" };

  const userId = Number(session.user.id);
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return { error: "unauthorized" };

  const ok = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!ok) return { error: "wrongCurrent" };

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
  await db.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, userId));

  return { success: true };
}
