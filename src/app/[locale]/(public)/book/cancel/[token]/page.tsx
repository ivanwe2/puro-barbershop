"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/lib/i18n/routing";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cancelBooking } from "@/actions/cancel-booking";

export default function CancelPage() {
  const t = useTranslations("booking");
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;

  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleCancel = async () => {
    setStatus("loading");
    const result = await cancelBooking(token);

    if (result.success) {
      setStatus("success");
    } else {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center sm:px-6 lg:px-8">
        <div className="mb-6 text-5xl">✓</div>
        <h1 className="text-foreground mb-4 text-3xl font-bold tracking-tight">
          {t("cancelSuccess")}
        </h1>
        <Button onClick={() => router.push("/")} variant="outline">
          {t("backToHome")}
        </Button>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center sm:px-6 lg:px-8">
        <h1 className="text-foreground mb-4 text-3xl font-bold tracking-tight">
          {t("cancelTitle")}
        </h1>
        <p className="text-muted-foreground mb-8">{t("cancelExpired")}</p>
        <Button onClick={() => router.push("/")} variant="outline">
          {t("backToHome")}
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 text-center sm:px-6 lg:px-8">
      <h1 className="text-foreground mb-4 text-3xl font-bold tracking-tight">{t("cancelTitle")}</h1>
      <p className="text-muted-foreground mb-8">{t("cancelConfirm")}</p>
      <div className="flex justify-center gap-4">
        <Button variant="outline" onClick={() => router.back()}>
          {t("back")}
        </Button>
        <Button onClick={handleCancel} disabled={status === "loading"} variant="destructive">
          {status === "loading" ? "..." : t("cancel")}
        </Button>
      </div>
    </div>
  );
}
