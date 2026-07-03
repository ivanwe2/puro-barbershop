"use server";

import { signIn as authSignIn } from "@/lib/auth";
import { AuthError } from "next-auth";
import { rateLimiters } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-ip";

export async function loginAction(prevState: { error: string | null }, formData: FormData) {
  // Brute-force protection: cap login attempts per client IP.
  const ip = await getClientIp();
  const check = await rateLimiters.login.limit(`login:${ip}`);
  if (!check.success) {
    return { error: "tooManyAttempts" };
  }

  // Only allow same-origin relative redirects (no protocol-relative "//host").
  const requested = formData.get("callbackUrl")?.toString() ?? "";
  const redirectTo =
    requested.startsWith("/") && !requested.startsWith("//") ? requested : "/bg/admin";

  try {
    await authSignIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: "invalidCredentials" };
    }
    throw err;
  }

  return { error: null };
}
