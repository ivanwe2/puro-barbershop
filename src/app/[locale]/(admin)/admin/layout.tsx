import type { ReactNode } from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { logoutAction } from "@/actions/admin/logout";
import { Link } from "@/lib/i18n/routing";
import Wordmark from "@/components/shared/Wordmark";

const adminNavItems = [
  { href: "/admin", labelKey: "dashboard" },
  { href: "/admin/schedule", labelKey: "schedule" },
  { href: "/admin/time-off", labelKey: "timeOff" },
];

const superAdminNavItems = [
  ...adminNavItems,
  { href: "/admin/barbers", labelKey: "barbers" },
  { href: "/admin/services", labelKey: "services" },
  { href: "/admin/settings", labelKey: "settings" },
];

function SidebarNav({
  navItems,
  t,
}: {
  navItems: { href: string; labelKey: string }[];
  t: (key: string) => string;
}) {
  return (
    <nav className="flex-1 space-y-1 px-3 py-4">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="text-muted-foreground hover:bg-accent hover:text-accent-foreground block rounded-lg px-3 py-2 text-sm font-medium transition-colors"
        >
          {t(item.labelKey)}
        </Link>
      ))}
    </nav>
  );
}

export default async function AdminLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();

  if (!session) {
    redirect(`/${locale}/admin/login`);
  }

  const t = await getTranslations("admin");
  const isSuperAdmin = session.user?.role === "super_admin";
  const navItems = isSuperAdmin ? superAdminNavItems : adminNavItems;

  return (
    <div className="flex min-h-screen">
      {/* Sidebar — desktop */}
      <aside className="hidden w-64 border-r lg:block">
        <div className="bg-muted/40 flex h-full flex-col border-r">
          <div className="flex h-14 items-center border-b px-6">
            <Link href="/" className="text-foreground">
              <Wordmark className="text-2xl" />
            </Link>
          </div>
          <SidebarNav navItems={navItems} t={t} />
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        {/* Top bar */}
        <header className="bg-background flex h-14 items-center justify-between border-b px-4 lg:px-6">
          <div className="flex items-center gap-4">
            {/* Mobile sidebar trigger */}
            <Sheet>
              <SheetTrigger>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="4" x2="20" y1="12" y2="12" />
                    <line x1="4" x2="20" y1="6" y2="6" />
                    <line x1="4" x2="20" y1="18" y2="18" />
                  </svg>
                  <span className="sr-only">Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <div className="flex h-full flex-col">
                  <div className="flex h-14 items-center border-b px-6">
                    <Link href="/" className="font-heading text-foreground text-xl">
                      Puro
                    </Link>
                  </div>
                  <SidebarNav navItems={navItems} t={t} />
                </div>
              </SheetContent>
            </Sheet>

            <span className="text-muted-foreground text-sm">{session.user?.email}</span>
            <Badge variant={isSuperAdmin ? "default" : "secondary"}>
              {isSuperAdmin ? t("roleSuperAdmin") : t("roleBarber")}
            </Badge>
          </div>

          <form action={logoutAction}>
            <Button type="submit" variant="ghost" size="sm">
              {t("logout")}
            </Button>
          </form>
        </header>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
