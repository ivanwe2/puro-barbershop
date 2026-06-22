"use client";

import { useTranslations } from "next-intl";
import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import Stepper from "@/components/booking/Stepper";
import StepService from "@/components/booking/StepService";
import StepBarber from "@/components/booking/StepBarber";
import StepDateTime from "@/components/booking/StepDateTime";
import StepDetails from "@/components/booking/StepDetails";
import { fetchServices, fetchBarbers, createBooking } from "@/actions/booking";
import type { InferSelectModel } from "drizzle-orm";
import { services, barbers } from "@/db/schema";
import { format } from "date-fns";

type ServiceRow = InferSelectModel<typeof services>;
type BarberRow = InferSelectModel<typeof barbers>;

interface BookingState {
  step: number;
  serviceId: number | null;
  barberId: number | "any";
  date: Date | null;
  time: string | null;
}

interface BookingConfirmation {
  bookingId: number;
}

const STEPS = 4;

function parseInitialState(searchParams: URLSearchParams): BookingState {
  const step = parseInt(searchParams.get("step") ?? "1", 10);
  const serviceParam = searchParams.get("service");
  const barberParam = searchParams.get("barber");
  const dateParam = searchParams.get("date");
  const timeParam = searchParams.get("time");

  const serviceId = serviceParam ? parseInt(serviceParam, 10) : null;
  const barberId = barberParam ? parseInt(barberParam, 10) : null;
  const date = dateParam ? new Date(dateParam) : null;

  return {
    step: isNaN(step) ? 1 : Math.min(Math.max(step, 1), STEPS),
    serviceId: serviceId && !isNaN(serviceId) ? serviceId : null,
    barberId: barberId && !isNaN(barberId) ? barberId : "any",
    date: date && !isNaN(date.getTime()) ? date : null,
    time: timeParam ?? null,
  };
}

export default function BookPage() {
  const t = useTranslations("booking");
  const searchParams = useSearchParams();
  const router = useRouter();
  const params = useParams();
  const locale = (params.locale as string) ?? "bg";

  const [data, setData] = useState({
    services: [] as ServiceRow[],
    barbers: [] as BarberRow[],
  });
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<BookingState>(() => parseInitialState(searchParams));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(null);

  // Load initial data
  useEffect(() => {
    async function load() {
      const [svcRes, barRes] = await Promise.all([fetchServices(), fetchBarbers()]);
      if ("services" in svcRes) {
        setData((d) => ({ ...d, services: svcRes.services }));
      }
      if ("barbers" in barRes) {
        setData((d) => ({ ...d, barbers: barRes.barbers }));
      }
      setLoading(false);
    }
    load();
  }, []);

  // Persist state to URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    params.set("step", String(state.step));
    if (state.serviceId) params.set("service", String(state.serviceId));
    else params.delete("service");
    if (state.barberId !== "any") params.set("barber", String(state.barberId));
    else params.delete("barber");
    if (state.date) params.set("date", format(state.date, "yyyy-MM-dd"));
    else params.delete("date");
    if (state.time) params.set("time", state.time);
    else params.delete("time");
    router.replace(`?${params.toString()}`);
  }, [state, router, searchParams]);

  const update = useCallback((partial: Partial<BookingState>) => {
    setState((prev) => ({ ...prev, ...partial }));
  }, []);

  const canProceed = () => {
    switch (state.step) {
      case 1:
        return state.serviceId !== null;
      case 2:
        return true;
      case 3:
        return state.date !== null && state.time !== null;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (state.step < STEPS) {
      setState((prev) => ({ ...prev, step: prev.step + 1 }));
    }
  };

  const prevStep = () => {
    if (state.step > 1) {
      setState((prev) => ({ ...prev, step: prev.step - 1 }));
    }
  };

  const handleDetailsSubmit = async (details: {
    name: string;
    email: string;
    phone: string;
    notes?: string | undefined;
    locale: string;
  }) => {
    setIsSubmitting(true);
    setSubmitError(null);

    if (!state.serviceId || !state.date || !state.time) {
      setSubmitError("booking_error");
      setIsSubmitting(false);
      return;
    }

    const result = await createBooking({
      serviceId: state.serviceId,
      barberId: state.barberId,
      date: format(state.date, "yyyy-MM-dd"),
      time: state.time,
      name: details.name,
      email: details.email,
      phone: details.phone,
      notes: details.notes,
      consent: true,
      locale: details.locale,
    });

    setIsSubmitting(false);

    if (result.success) {
      setConfirmation({ bookingId: result.bookingId });
    } else {
      setSubmitError(result.error);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Confirmation screen
  if (confirmation) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center sm:px-6 lg:px-8">
        <div className="mb-6 text-5xl">✓</div>
        <h1 className="text-foreground mb-4 text-3xl font-bold tracking-tight">
          {t("confirmationTitle")}
        </h1>
        <p className="text-muted-foreground mb-2">
          {t("confirmationBookingId", { id: confirmation.bookingId })}
        </p>
        <p className="text-muted-foreground mb-8">{t("confirmationEmailSent")}</p>
        <Button onClick={() => router.push("/")} variant="outline">
          {t("backToHome")}
        </Button>
      </div>
    );
  }

  const stepLabels = [t("stepService"), t("stepBarber"), t("stepDateTime"), t("stepDetails")];

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <Stepper currentStep={state.step} steps={stepLabels} />

      <div className="min-h-[400px]">
        {state.step === 1 && (
          <StepService
            services={data.services}
            selectedId={state.serviceId}
            onSelect={(id) => update({ serviceId: id })}
          />
        )}
        {state.step === 2 && (
          <StepBarber
            barbers={data.barbers}
            selectedId={state.barberId}
            onSelect={(id) => update({ barberId: id })}
          />
        )}
        {state.step === 3 && (
          <StepDateTime
            serviceId={state.serviceId}
            barberId={state.barberId}
            selectedDate={state.date}
            selectedTime={state.time}
            onSelectDate={(date) => update({ date, time: null })}
            onSelectTime={(time) => update({ time })}
          />
        )}
        {state.step === 4 && (
          <StepDetails
            locale={locale}
            onSubmit={handleDetailsSubmit}
            isSubmitting={isSubmitting}
            error={submitError}
          />
        )}
      </div>

      <div className="mt-8 flex justify-between">
        <Button variant="outline" onClick={prevStep} disabled={state.step === 1}>
          ← {t("back")}
        </Button>
        {state.step < STEPS && (
          <Button onClick={nextStep} disabled={!canProceed()}>
            {t("next")} →
          </Button>
        )}
      </div>
    </div>
  );
}
