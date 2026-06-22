"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { fetchSlots } from "@/actions/booking";
import { format } from "date-fns";
import { bg } from "date-fns/locale";

interface StepDateTimeProps {
  serviceId: number | null;
  barberId: number | "any";
  selectedDate: Date | null;
  selectedTime: string | null;
  onSelectDate: (date: Date) => void;
  onSelectTime: (time: string) => void;
}

export default function StepDateTime({
  serviceId,
  barberId,
  selectedDate,
  selectedTime,
  onSelectDate,
  onSelectTime,
}: StepDateTimeProps) {
  const t = useTranslations("booking");
  const [slots, setSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSlots = async (date: Date) => {
    if (!serviceId) return;
    setLoading(true);
    setError(null);
    setSlots([]);
    try {
      const result = await fetchSlots({
        serviceId,
        barberId,
        date: format(date, "yyyy-MM-dd"),
      });
      if ("error" in result) {
        setError(result.error);
      } else {
        setSlots(result.slots);
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-foreground mb-6 text-2xl font-semibold tracking-tight">
        {t("stepDateTime")}
      </h2>
      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="flex-1">
          <Calendar
            mode="single"
            selected={selectedDate ?? undefined}
            onSelect={(date) => {
              if (date) {
                onSelectDate(date);
                loadSlots(date);
              }
            }}
            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
            locale={bg}
            className="border-border bg-background rounded-lg border p-3"
          />
        </div>

        <div className="flex-1">
          {selectedDate ? (
            <div>
              <p className="text-muted-foreground mb-4 text-sm font-medium">
                {format(selectedDate, "EEEE, dd MMMM yyyy", { locale: bg })}
              </p>
              {loading && (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full rounded-md" />
                  ))}
                </div>
              )}
              {error && <p className="text-destructive text-sm">{error}</p>}
              {!loading && !error && slots.length === 0 && selectedDate && (
                <p className="text-muted-foreground text-sm">{t("noSlotsAvailable")}</p>
              )}
              {!loading && slots.length > 0 && (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {slots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => onSelectTime(slot)}
                      className={cn(
                        "rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                        selectedTime === slot
                          ? "border-accent bg-accent text-accent-foreground"
                          : "border-border bg-background text-foreground hover:border-accent hover:text-accent",
                      )}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">{t("selectDateFirst")}</p>
          )}
        </div>
      </div>
    </div>
  );
}
