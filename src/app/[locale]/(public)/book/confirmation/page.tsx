import { db } from "@/db";
import { bookings, services, barbers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { format } from "date-fns";
import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/routing";

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  return `${local[0]}***@${domain}`;
}

function maskPhone(phone: string): string {
  const last2 = phone.slice(-2);
  return `+359 *** *** ${last2}`;
}

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const t = await getTranslations("booking");
  const params = await searchParams;
  const id = params.id;

  if (!id) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center sm:px-6 lg:px-8">
        <h1 className="text-foreground mb-4 text-3xl font-bold tracking-tight">
          {t("booking_error")}
        </h1>
        <Link href="/" className="text-primary hover:underline">
          {t("backToHome")}
        </Link>
      </div>
    );
  }

  const bookingId = parseInt(id, 10);
  if (isNaN(bookingId)) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center sm:px-6 lg:px-8">
        <h1 className="text-foreground mb-4 text-3xl font-bold tracking-tight">
          {t("booking_error")}
        </h1>
        <Link href="/" className="text-primary hover:underline">
          {t("backToHome")}
        </Link>
      </div>
    );
  }

  const rows = await db.select().from(bookings).where(eq(bookings.id, bookingId));

  const booking = rows.find((b) => b.id === bookingId);

  if (!booking) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center sm:px-6 lg:px-8">
        <h1 className="text-foreground mb-4 text-3xl font-bold tracking-tight">
          {t("booking_error")}
        </h1>
        <Link href="/" className="text-primary hover:underline">
          {t("backToHome")}
        </Link>
      </div>
    );
  }

  // Fetch service and barber
  const serviceRows = await db.select().from(services).where(eq(services.id, booking.serviceId));
  const service = serviceRows.find((s) => s.id === booking.serviceId);

  const barberRows = await db.select().from(barbers).where(eq(barbers.id, booking.barberId));
  const barber = barberRows.find((b) => b.id === booking.barberId);

  const serviceName = service ? (booking.locale === "bg" ? service.nameBg : service.nameEn) : "—";
  const barberName = barber ? (booking.locale === "bg" ? barber.nameBg : barber.nameEn) : "—";

  const dateStr = format(booking.startDatetime, "EEEE, MMMM d, yyyy");
  const timeStr = format(booking.startDatetime, "HH:mm");

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-6 text-center text-5xl">✓</div>
      <h1 className="text-foreground mb-4 text-center text-3xl font-bold tracking-tight">
        {t("confirmationTitle")}
      </h1>
      <p className="text-muted-foreground mb-8 text-center">
        {t("confirmationBookingId", { id: booking.id })}
      </p>

      <div className="border-border bg-card mb-8 rounded-lg border p-6">
        <div className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground font-medium">Service:</span>{" "}
            <span className="text-foreground">{serviceName}</span>
          </p>
          <p>
            <span className="text-muted-foreground font-medium">Barber:</span>{" "}
            <span className="text-foreground">{barberName}</span>
          </p>
          <p>
            <span className="text-muted-foreground font-medium">Date:</span>{" "}
            <span className="text-foreground">{dateStr}</span>
          </p>
          <p>
            <span className="text-muted-foreground font-medium">Time:</span>{" "}
            <span className="text-foreground">{timeStr}</span>
          </p>
          <p>
            <span className="text-muted-foreground font-medium">Name:</span>{" "}
            <span className="text-foreground">{booking.customerName}</span>
          </p>
          <p>
            <span className="text-muted-foreground font-medium">Email:</span>{" "}
            <span className="text-foreground">{maskEmail(booking.customerEmail)}</span>
          </p>
          <p>
            <span className="text-muted-foreground font-medium">Phone:</span>{" "}
            <span className="text-foreground">{maskPhone(booking.customerPhone)}</span>
          </p>
        </div>
      </div>

      <div className="text-center">
        <p className="text-muted-foreground mb-8">{t("confirmationEmailSent")}</p>
        <Link href="/" className="text-primary hover:underline">
          {t("backToHome")}
        </Link>
      </div>
    </div>
  );
}
