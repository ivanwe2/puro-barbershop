import Link from "next/link";
import SloganDivider from "./SloganDivider";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-border bg-muted border-t">
      <SloganDivider />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Address & hours */}
          <div>
            <h3 className="font-heading text-foreground mb-4 text-lg font-semibold">
              Puro Barbershop
            </h3>
            <address className="text-muted-foreground text-sm not-italic">
              <p>Бул. Христо Ботев 114</p>
              <p>Пловдив, България</p>
            </address>
            <div className="text-muted-foreground mt-4 text-sm">
              <p>Пон–Пет: 09:00–19:00</p>
              <p>Съб: 09:00–17:00</p>
              <p>Нед: Затворено</p>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="font-heading text-foreground mb-4 text-lg font-semibold">Навигация</h3>
            <nav className="flex flex-col gap-2 text-sm">
              <Link
                href="/bg/book"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Запази час
              </Link>
              <Link
                href="/bg"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Услуги
              </Link>
              <Link
                href="/bg"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Галерия
              </Link>
              <Link
                href="/bg"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Местоположение
              </Link>
            </nav>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-heading text-foreground mb-4 text-lg font-semibold">
              Правна информация
            </h3>
            <nav className="flex flex-col gap-2 text-sm">
              <Link
                href="/bg/legal/privacy"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Политика за поверителност
              </Link>
              <Link
                href="/bg/legal/terms"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Условия за ползване
              </Link>
              <Link
                href="/bg/legal/cookies"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Информация за бисквитки
              </Link>
            </nav>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-border text-muted-foreground mt-12 flex flex-col items-center justify-between gap-4 border-t pt-6 text-center text-xs md:flex-row">
          <p>© {currentYear} Puro Barbershop. Всички права запазени.</p>
          <div className="flex items-center gap-4">
            <a
              href="https://www.instagram.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Instagram"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
