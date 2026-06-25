"use client";

import { useTranslations, useLocale } from "next-intl";
import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { isValidPhoneNumber } from "libphonenumber-js";
import { format, addDays } from "date-fns";
import { fetchServices, fetchBarbers, fetchSlots, createBooking } from "@/actions/booking";
import { Link } from "@/lib/i18n/routing";
import type { InferSelectModel } from "drizzle-orm";
import { services, barbers } from "@/db/schema";

type ServiceRow = InferSelectModel<typeof services>;
type BarberRow = InferSelectModel<typeof barbers>;

const detailsSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().max(255),
  // Match the server: a real, dialable number (defaults to BG region).
  phone: z
    .string()
    .min(7)
    .max(30)
    .refine((v) => isValidPhoneNumber(v, "BG"), { message: "phoneInvalid" }),
  consent: z.literal(true),
});
type DetailsForm = z.infer<typeof detailsSchema>;

const FIELD =
  "w-full box-border rounded-[2px] border border-[rgba(21,18,14,0.15)] bg-white px-4 py-[14px] text-[15px] text-[var(--ink)] outline-none focus:border-[var(--ink)]";
const FIELD_LABEL =
  "mb-[10px] block text-xs font-bold tracking-[0.1em] text-[var(--muted-foreground)] uppercase";

export default function BookPage() {
  const t = useTranslations("booking");
  const locale = useLocale();
  const searchParams = useSearchParams();

  const [serviceList, setServiceList] = useState<ServiceRow[]>([]);
  const [barberList, setBarberList] = useState<BarberRow[]>([]);
  const [loading, setLoading] = useState(true);

  const initialService = Number(searchParams.get("service")) || null;
  const [serviceId, setServiceId] = useState<number | null>(initialService);
  const [barberId, setBarberId] = useState<number | "any">("any");
  const [date, setDate] = useState<string>("");
  const [time, setTime] = useState<string | null>(null);

  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DetailsForm>({
    resolver: zodResolver(detailsSchema),
    defaultValues: { name: "", email: "", phone: "", consent: false as unknown as true },
  });
  const consentChecked = watch("consent");

  // Load services + barbers once.
  useEffect(() => {
    let active = true;
    (async () => {
      const [svc, bar] = await Promise.all([fetchServices(), fetchBarbers()]);
      if (!active) return;
      if ("services" in svc) {
        setServiceList(svc.services);
        // Default to the first service if none pre-selected via ?service=.
        setServiceId((prev) => prev ?? svc.services[0]?.id ?? null);
      }
      if ("barbers" in bar) setBarberList(bar.barbers);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  // Fetch available slots whenever service / barber / date change.
  useEffect(() => {
    if (!serviceId || !date) {
      setSlots([]);
      return;
    }
    let active = true;
    setSlotsLoading(true);
    setTime(null);
    (async () => {
      const res = await fetchSlots({ serviceId, barberId, date });
      if (!active) return;
      setSlots("slots" in res ? res.slots : []);
      setSlotsLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [serviceId, barberId, date]);

  const onSubmit = useCallback(
    async (details: DetailsForm) => {
      setSelectionError(null);
      setSubmitError(null);
      if (!serviceId || !date) {
        setSelectionError(t("required"));
        return;
      }
      if (!time) {
        setSelectionError(t("selectTime"));
        return;
      }
      setIsSubmitting(true);
      const result = await createBooking({
        serviceId,
        barberId,
        date,
        time,
        name: details.name,
        email: details.email,
        phone: details.phone,
        consent: true,
        locale,
      });
      setIsSubmitting(false);
      if (result.success) setBookingId(result.bookingId);
      else setSubmitError(result.error);
    },
    [serviceId, barberId, date, time, locale, t],
  );

  const priceLabel = (s: ServiceRow) => {
    const n = Number(s.priceBgn);
    return Number.isInteger(n) ? String(n) : s.priceBgn;
  };
  const serviceName = (s: ServiceRow) => (locale === "bg" ? s.nameBg : s.nameEn);
  const barberName = (b: BarberRow) => (locale === "bg" ? b.nameBg : b.nameEn);

  const today = format(new Date(), "yyyy-MM-dd");
  const maxDate = format(addDays(new Date(), 60), "yyyy-MM-dd");

  // ---- Confirmation state ----
  if (bookingId) {
    return (
      <section className="bg-[#1a1611] px-[clamp(22px,5vw,40px)] py-[clamp(72px,11vw,120px)]">
        <div className="mx-auto max-w-[560px] rounded-[4px] bg-[var(--paper)] p-[clamp(28px,5vw,48px)] text-center">
          <div className="mb-4 text-5xl text-[var(--ink)]">✓</div>
          <h1 className="font-heading mb-3 text-[clamp(28px,4vw,44px)] leading-none font-bold text-[var(--ink)]">
            {t("confirmationTitle")}
          </h1>
          <p className="text-[var(--muted-foreground)]">
            {t("confirmationBookingId", { id: bookingId })}
          </p>
          <p className="mt-1 text-[var(--muted-foreground)]">{t("confirmationEmailSent")}</p>
          <Link
            href="/"
            className="mt-8 inline-block rounded-[2px] border border-[var(--ink)] px-6 py-3 text-sm font-bold tracking-[0.04em] text-[var(--ink)] uppercase transition-colors hover:bg-[var(--ink)] hover:text-[var(--paper)]"
          >
            {t("backToHome")}
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-[#1a1611] px-[clamp(22px,5vw,40px)] py-[clamp(72px,11vw,120px)]">
      <div className="mx-auto max-w-[980px]">
        <div className="mb-14 text-center">
          <div className="mb-[18px] text-[13px] font-semibold tracking-[0.22em] text-[var(--paper)]/50 uppercase">
            {t("subtitle")}
          </div>
          <h1 className="font-heading m-0 text-[clamp(36px,5vw,64px)] leading-none font-bold tracking-[-0.01em] text-[#f6f2eb]">
            {t("title")}
          </h1>
        </div>

        <div className="rounded-[4px] bg-[var(--paper)] p-[clamp(24px,5vw,44px)]">
          {loading ? (
            <p className="py-12 text-center text-[var(--muted-foreground)]">{t("loadingSlots")}</p>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="grid grid-cols-1 gap-x-7 gap-y-6 sm:grid-cols-2">
                {/* Service */}
                <label className="block">
                  <span className={FIELD_LABEL}>{t("service")}</span>
                  <select
                    className={`${FIELD} appearance-none`}
                    value={serviceId ?? ""}
                    onChange={(e) => setServiceId(Number(e.target.value) || null)}
                  >
                    {serviceList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {serviceName(s)} — €{priceLabel(s)}
                      </option>
                    ))}
                  </select>
                </label>

                {/* Barber */}
                <label className="block">
                  <span className={FIELD_LABEL}>{t("barber")}</span>
                  <select
                    className={`${FIELD} appearance-none`}
                    value={barberId}
                    onChange={(e) =>
                      setBarberId(e.target.value === "any" ? "any" : Number(e.target.value))
                    }
                  >
                    <option value="any">{t("noPreference")}</option>
                    {barberList.map((b) => (
                      <option key={b.id} value={b.id}>
                        {barberName(b)}
                      </option>
                    ))}
                  </select>
                </label>

                {/* Date */}
                <label className="block">
                  <span className={FIELD_LABEL}>{t("date")}</span>
                  <input
                    type="date"
                    className={FIELD}
                    value={date}
                    min={today}
                    max={maxDate}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </label>

                {/* Time chips */}
                <div className="block">
                  <span className={FIELD_LABEL}>{t("time")}</span>
                  {!date ? (
                    <p className="pt-[14px] text-sm text-[var(--muted-foreground)]">
                      {t("selectDateFirst")}
                    </p>
                  ) : slotsLoading ? (
                    <p className="pt-[14px] text-sm text-[var(--muted-foreground)]">
                      {t("loadingSlots")}
                    </p>
                  ) : slots.length === 0 ? (
                    <p className="pt-[14px] text-sm text-[var(--muted-foreground)]">
                      {t("noSlotsAvailable")}
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {slots.map((s) => {
                        const active = time === s;
                        return (
                          <button
                            type="button"
                            key={s}
                            onClick={() => setTime(s)}
                            className={`min-h-[44px] rounded-[2px] border px-4 py-[11px] text-sm font-semibold transition-colors ${
                              active
                                ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)]"
                                : "border-[rgba(21,18,14,0.18)] bg-white text-[var(--ink)] hover:border-[var(--ink)]"
                            }`}
                          >
                            {s}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Name */}
                <label className="block">
                  <span className={FIELD_LABEL}>{t("name")}</span>
                  <input
                    type="text"
                    className={FIELD}
                    placeholder={t("name")}
                    aria-invalid={!!errors.name}
                    {...register("name")}
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-[var(--destructive)]" role="alert">
                      {t("required")}
                    </p>
                  )}
                </label>

                {/* Phone */}
                <label className="block">
                  <span className={FIELD_LABEL}>{t("phone")}</span>
                  <input
                    type="tel"
                    className={FIELD}
                    placeholder="+359 888 123 456"
                    aria-invalid={!!errors.phone}
                    {...register("phone")}
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-[var(--destructive)]" role="alert">
                      {t("phoneInvalid")}
                    </p>
                  )}
                </label>

                {/* Email — full width */}
                <label className="block sm:col-span-2">
                  <span className={FIELD_LABEL}>{t("email")}</span>
                  <input
                    type="email"
                    className={FIELD}
                    placeholder="name@example.com"
                    aria-invalid={!!errors.email}
                    {...register("email")}
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-[var(--destructive)]" role="alert">
                      {t("emailInvalid")}
                    </p>
                  )}
                </label>
              </div>

              {/* Consent */}
              <label className="mt-6 flex items-start gap-3 text-sm text-[var(--muted-foreground)]">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 accent-[var(--ink)]"
                  checked={consentChecked === true}
                  onChange={(e) =>
                    setValue("consent", e.target.checked as unknown as true, {
                      shouldValidate: true,
                    })
                  }
                />
                <span>
                  {t("consent")}{" "}
                  <Link
                    href="/legal/privacy"
                    className="text-[var(--ink)] underline underline-offset-4"
                  >
                    {t("privacy")}
                  </Link>{" "}
                  {locale === "bg" ? "и" : "and"}{" "}
                  <Link
                    href="/legal/terms"
                    className="text-[var(--ink)] underline underline-offset-4"
                  >
                    {t("terms")}
                  </Link>
                </span>
              </label>
              {errors.consent && (
                <p className="mt-1 text-sm text-[var(--destructive)]" role="alert">
                  {t("consent")}
                </p>
              )}

              {(selectionError || submitError) && (
                <p className="mt-4 text-sm text-[var(--destructive)]" role="alert">
                  {selectionError ??
                    (submitError === "slotTaken"
                      ? t("slotTaken")
                      : submitError === "tooManyRequests"
                        ? t("tooManyRequests")
                        : t("booking_error"))}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-8 w-full rounded-[2px] bg-[var(--ink)] py-[18px] text-[15px] font-bold tracking-[0.04em] text-[var(--paper)] transition-colors hover:bg-black disabled:opacity-60"
              >
                {isSubmitting ? "…" : `${t("confirm")} →`}
              </button>

              <p className="mt-[18px] text-center text-[13px] text-[var(--muted-foreground)]">
                {t("ctaCall")}{" "}
                <strong className="text-[var(--ink)]">
                  {process.env.NEXT_PUBLIC_SHOP_PHONE || "[PLACEHOLDER:shop_phone]"}
                </strong>{" "}
                · {t("walkins")}
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
