"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateSettings } from "@/actions/admin/settings";
import { toast } from "sonner";

type SettingsObj = Record<string, string>;

export default function SettingsClient({ initialSettings }: { initialSettings: SettingsObj }) {
  const t = useTranslations("admin");
  const [bufferMinutes, setBufferMinutes] = useState(initialSettings.buffer_minutes ?? "15");
  const [cancellationWindowHours, setCancellationWindowHours] = useState(
    initialSettings.cancellation_window_hours ?? "24",
  );
  const [bookingHorizonDays, setBookingHorizonDays] = useState(
    initialSettings.booking_horizon_days ?? "60",
  );
  const [slotGranularityMinutes, setSlotGranularityMinutes] = useState(
    initialSettings.slot_granularity_minutes ?? "15",
  );
  const [shopEmail, setShopEmail] = useState(initialSettings.shop_email ?? "");
  const [shopPhone, setShopPhone] = useState(initialSettings.shop_phone ?? "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.set("bufferMinutes", bufferMinutes);
    formData.set("cancellationWindowHours", cancellationWindowHours);
    formData.set("bookingHorizonDays", bookingHorizonDays);
    formData.set("slotGranularityMinutes", slotGranularityMinutes);
    formData.set("shopEmail", shopEmail);
    formData.set("shopPhone", shopPhone);

    const result = await updateSettings(formData);
    if ("error" in result) {
      toast.error("Error saving settings");
      return;
    }
    toast.success("Settings saved");
  };

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-foreground text-2xl">{t("settings")}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{t("settings")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>{t("bufferMinutes")}</Label>
              <Input
                type="number"
                value={bufferMinutes}
                onChange={(e) => setBufferMinutes(e.target.value)}
                min="0"
                max="60"
              />
            </div>

            <div className="space-y-2">
              <Label>{t("cancellationWindowHours")}</Label>
              <Input
                type="number"
                value={cancellationWindowHours}
                onChange={(e) => setCancellationWindowHours(e.target.value)}
                min="1"
                max="168"
              />
            </div>

            <div className="space-y-2">
              <Label>{t("bookingHorizonDays")}</Label>
              <Input
                type="number"
                value={bookingHorizonDays}
                onChange={(e) => setBookingHorizonDays(e.target.value)}
                min="1"
                max="365"
              />
            </div>

            <div className="space-y-2">
              <Label>{t("slotGranularityMinutes")}</Label>
              <Input
                type="number"
                value={slotGranularityMinutes}
                onChange={(e) => setSlotGranularityMinutes(e.target.value)}
                min="5"
                max="60"
                step="5"
              />
            </div>

            <div className="space-y-2">
              <Label>{t("shopEmail")}</Label>
              <Input
                type="email"
                value={shopEmail}
                onChange={(e) => setShopEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("shopPhone")}</Label>
              <Input value={shopPhone} onChange={(e) => setShopPhone(e.target.value)} />
            </div>

            <Button type="submit">{t("save")}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
