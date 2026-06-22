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

    // Allow login page without auth
    if (pathname.endsWith("/admin/login")) {
      return intlMiddleware(req);
    }

    // Redirect to login if not authenticated
    if (!req.auth) {
      const signInUrl = new URL(`/${locale}/admin/login`, req.url);
      signInUrl.searchParams.set("callbackUrl", req.nextUrl.href);
      return NextResponse.redirect(signInUrl);
    }

    // Block barbers from super-admin-only routes
    if (req.auth.user?.role === "barber" && isSuperAdminRoute(pathname)) {
      return NextResponse.redirect(new URL(`/${locale}/admin`, req.url));
    }
  }

  // Run locale middleware for all other requests
  return intlMiddleware(req);
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
