import { z } from "zod";

export const bookingDetailsSchema = z.object({
  serviceId: z.number().int().positive(),
  barberId: z.union([z.literal("any"), z.number().int().positive()]),
  date: z.string().date(),
  time: z.string().refine((v) => /^\d{2}:\d{2}$/.test(v), "Invalid time format"),
  name: z.string().min(2).max(100),
  email: z.string().email().max(255),
  phone: z.string().min(7).max(30),
  notes: z.string().max(500).optional(),
  consent: z.literal(true),
  locale: z.string().min(2).max(5),
});

export type BookingDetailsInput = z.infer<typeof bookingDetailsSchema>;

export const getSlotsSchema = z.object({
  serviceId: z.number().int().positive(),
  barberId: z.union([z.literal("any"), z.number().int().positive()]),
  date: z.string().date(),
});

export type GetSlotsInput = z.infer<typeof getSlotsSchema>;
