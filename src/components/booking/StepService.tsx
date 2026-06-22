"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { InferSelectModel } from "drizzle-orm";
import { services } from "@/db/schema";

type ServiceRow = InferSelectModel<typeof services>;

interface StepServiceProps {
  services: ServiceRow[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}

export default function StepService({ services: list, selectedId, onSelect }: StepServiceProps) {
  const t = useTranslations("booking");

  return (
    <div>
      <h2 className="text-foreground mb-6 text-2xl font-semibold tracking-tight">
        {t("stepService")}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {list.map((s) => (
          <Card
            key={s.id}
            className={cn(
              "hover:border-accent cursor-pointer transition-colors",
              selectedId === s.id && "border-accent ring-accent ring-1",
            )}
            onClick={() => onSelect(s.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(s.id);
              }
            }}
            aria-pressed={selectedId === s.id}
          >
            <CardContent className="flex flex-col gap-1 p-5">
              <span className="text-foreground text-lg font-medium">{s.nameBg}</span>
              <span className="text-muted-foreground text-sm">
                {s.durationMinutes} min · {s.priceBgn} лв
              </span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
