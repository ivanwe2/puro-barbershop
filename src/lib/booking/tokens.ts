import crypto from "crypto";
import { env } from "@/lib/env";

const CANCELLATION_TOKEN_LENGTH = 32;

export function generateCancellationToken(bookingId: number): string {
  const secret = env.AUTH_SECRET;
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(String(bookingId));
  return hmac.digest("hex").slice(0, CANCELLATION_TOKEN_LENGTH);
}

export function verifyCancellationToken(token: string, bookingId: number): boolean {
  const expected = generateCancellationToken(bookingId);
  return crypto.timingSafeEqual(
    new TextEncoder().encode(token),
    new TextEncoder().encode(expected),
  );
}
