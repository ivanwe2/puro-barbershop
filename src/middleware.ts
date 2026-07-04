import createIntlMiddleware from "next-intl/middleware";
import { locales, defaultLocale } from "@/lib/i18n/config";
import { auth } from "@/lib/auth-edge";
import { NextResponse } from "next/server";

const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: "always",
});

const SUPER_ADMIN_ROUTES = ["/barbers", "/services", "/settings"];

function isSuperAdminRoute(pathname: string): boolean {
  return SUPER_ADMIN_ROUTES.some((route) => pathname.includes(`/admin${route}`));
}

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Admin route protection
  if (pathname.startsWith("/bg/admin") || pathname.startsWith("/en/admin")) {
    const locale = pathname.startsWith("/bg") ? "bg" : "en";

    let res: NextResponse;
    if (pathname.endsWith("/admin/login")) {
      // Login page — reachable without auth.
      res = intlMiddleware(req);
    } else if (!req.auth) {
      // Not authenticated — send to login, preserving the intended target.
      const signInUrl = new URL(`/${locale}/admin/login`, req.url);
      signInUrl.searchParams.set("callbackUrl", req.nextUrl.href);
      res = NextResponse.redirect(signInUrl);
    } else if (req.auth.user?.role === "barber" && isSuperAdminRoute(pathname)) {
      // Block barbers from super-admin-only routes.
      res = NextResponse.redirect(new URL(`/${locale}/admin`, req.url));
    } else {
      res = intlMiddleware(req);
    }

    // Keep the entire admin area (including login) out of search indexes.
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
    return res;
  }

  // Run locale middleware for all other requests
  return intlMiddleware(req);
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
