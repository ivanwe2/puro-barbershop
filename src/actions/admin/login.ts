"use server";

import { signIn as authSignIn } from "@/lib/auth";
import { AuthError } from "next-auth";

export async function loginAction(prevState: { error: string | null }, formData: FormData) {
  try {
    await authSignIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: formData.get("callbackUrl")?.toString() || "/bg/admin",
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: "invalidCredentials" };
    }
    return { error: "invalidCredentials" };
  }

  return { error: null };
}
