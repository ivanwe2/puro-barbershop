import { headers } from "next/headers";

/**
 * Best-effort client IP from request headers. Prefers Cloudflare's
 * `CF-Connecting-IP` (authoritative when the site is proxied through
 * Cloudflare), then standard proxy headers. Returns "unknown" if none present.
 */
export async function getClientIp(): Promise<string> {
  const h = await headers();

  const cf = h.get("cf-connecting-ip");
  if (cf) return cf.trim();

  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";

  const real = h.get("x-real-ip");
  if (real) return real.trim();

  return "unknown";
}
