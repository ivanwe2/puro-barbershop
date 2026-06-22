"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { InferSelectModel } from "drizzle-orm";
import { barbers } from "@/db/schema";

type BarberRow = InferSelectModel<typeof barbers>;

interface StepBarberProps {
  barbers: BarberRow[];
  selectedId: number | "any";
  onSelect: (id: number | "any") => void;
}

function InitialsAvatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  return (
    <div className="bg-muted/50 text-muted-foreground flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
      {initials}
    </div>
  );
}

export default function StepBarber({ barbers: list, selectedId, onSelect }: StepBarberProps) {
  const t = useTranslations("booking");

  return (
    <div>
      <h2 className="text-foreground mb-6 text-2xl font-semibold tracking-tight">
        {t("stepBarber")}
      </h2>
      <div className="flex flex-col gap-3">
        <Card
          className={cn(
            "hover:border-accent cursor-pointer transition-colors",
            selectedId === "any" && "border-accent ring-accent ring-1",
          )}
          onClick={() => onSelect("any")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onSelect("any");
            }
          }}
          aria-pressed={selectedId === "any"}
        >
          <CardContent className="flex items-center gap-4 p-4">
            <div className="bg-accent/20 text-accent flex h-12 w-12 shrink-0 items-center justify-center rounded-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <span className="text-foreground text-lg font-medium">{t("anyBarber")}</span>
          </CardContent>
        </Card>

        {list.map((b) => (
          <Card
            key={b.id}
            className={cn(
              "hover:border-accent cursor-pointer transition-colors",
              selectedId === b.id && "border-accent ring-accent ring-1",
            )}
            onClick={() => onSelect(b.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(b.id);
              }
            }}
            aria-pressed={selectedId === b.id}
          >
            <CardContent className="flex items-center gap-4 p-4">
              {b.photoUrl ? (
                <img
                  src={b.photoUrl}
                  alt={b.nameBg}
                  className="h-12 w-12 rounded-full object-cover"
                />
              ) : (
                <InitialsAvatar name={b.nameBg} />
              )}
              <div>
                <span className="text-foreground block text-lg font-medium">{b.nameBg}</span>
                {b.bioBg && <span className="text-muted-foreground block text-sm">{b.bioBg}</span>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
