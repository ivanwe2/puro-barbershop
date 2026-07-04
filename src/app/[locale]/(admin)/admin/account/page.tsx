"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changeOwnPassword } from "@/actions/admin/account";
import { toast } from "sonner";

export default function AccountPage() {
  const t = useTranslations("admin");
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next !== confirm) {
      toast.error(t("passwordMismatch"));
      return;
    }
    setSubmitting(true);
    const result = await changeOwnPassword({ currentPassword: current, newPassword: next });
    setSubmitting(false);

    if ("success" in result) {
      toast.success(t("passwordChanged"));
      setCurrent("");
      setNext("");
      setConfirm("");
      return;
    }
    const map: Record<string, string> = {
      wrongCurrent: "wrongCurrentPassword",
      weakPassword: "weakPassword",
      unauthorized: "error",
    };
    toast.error(t(map[result.error] ?? "error"));
  };

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-foreground text-2xl">{t("account")}</h1>

      <Card>
        <CardContent className="max-w-md space-y-4 pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>{t("currentPassword")}</Label>
              <Input
                type="password"
                autoComplete="current-password"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>{t("newPassword")}</Label>
              <Input
                type="password"
                autoComplete="new-password"
                value={next}
                onChange={(e) => setNext(e.target.value)}
                required
                minLength={12}
              />
              <p className="text-muted-foreground text-xs">{t("passwordHint")}</p>
            </div>
            <div className="space-y-2">
              <Label>{t("confirmPassword")}</Label>
              <Input
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={12}
              />
            </div>
            <Button type="submit" disabled={submitting || !current || !next || !confirm}>
              {t("changePassword")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
