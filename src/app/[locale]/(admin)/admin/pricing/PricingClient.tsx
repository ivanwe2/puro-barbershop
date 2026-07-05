"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { savePricing } from "@/actions/admin/pricing";
import { toast } from "sonner";

interface Service {
  id: number;
  nameBg: string;
  nameEn: string;
  priceBgn: string;
}
interface Barber {
  id: number;
  nameBg: string;
  nameEn: string;
}
interface Override {
  barberId: number;
  serviceId: number;
  priceEur: string;
}

const cellKey = (barberId: number, serviceId: number) => `${barberId}:${serviceId}`;

export default function PricingClient({
  services,
  barbers,
  overrides,
}: {
  services: Service[];
  barbers: Barber[];
  overrides: Override[];
}) {
  const t = useTranslations("admin");
  const locale = useLocale();
  const name = (o: { nameBg: string; nameEn: string }) => (locale === "bg" ? o.nameBg : o.nameEn);

  // Cell values keyed by barber:service. Empty string = inherit the base price.
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const o of overrides) initial[cellKey(o.barberId, o.serviceId)] = o.priceEur;
    return initial;
  });
  const [saving, setSaving] = useState(false);

  const setCell = (barberId: number, serviceId: number, v: string) =>
    setValues((prev) => ({ ...prev, [cellKey(barberId, serviceId)]: v }));

  const handleSave = async () => {
    setSaving(true);
    const entries = barbers.flatMap((b) =>
      services.map((s) => ({
        barberId: b.id,
        serviceId: s.id,
        priceEur: (values[cellKey(b.id, s.id)] ?? "").trim(),
      })),
    );
    const result = await savePricing({ entries });
    setSaving(false);
    if ("error" in result) {
      toast.error("Error saving prices");
      return;
    }
    toast.success("Prices saved");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-foreground text-2xl">{t("pricing")}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{t("pricingIntro")}</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-2 pr-4 text-left font-medium">{t("service")}</th>
                  <th className="text-muted-foreground py-2 pr-4 text-right font-medium whitespace-nowrap">
                    {t("basePrice")}
                  </th>
                  {barbers.map((b) => (
                    <th key={b.id} className="px-2 py-2 text-right font-medium whitespace-nowrap">
                      {name(b)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {services.map((s) => (
                  <tr key={s.id} className="border-b last:border-0">
                    <td className="py-3 pr-4 font-medium whitespace-nowrap">{name(s)}</td>
                    <td className="text-muted-foreground py-3 pr-4 text-right whitespace-nowrap">
                      €{s.priceBgn}
                    </td>
                    {barbers.map((b) => (
                      <td key={b.id} className="px-2 py-2">
                        <Input
                          type="text"
                          inputMode="decimal"
                          className="w-24 text-right"
                          placeholder={`€${s.priceBgn}`}
                          value={values[cellKey(b.id, s.id)] ?? ""}
                          onChange={(e) => setCell(b.id, s.id, e.target.value)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-muted-foreground mt-4 text-xs">{t("pricingHint")}</p>

          <Button type="button" className="mt-4" onClick={handleSave} disabled={saving}>
            {t("save")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
