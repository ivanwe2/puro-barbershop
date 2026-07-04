"use client";

import { useActionState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { loginAction } from "@/actions/admin/login";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Wordmark from "@/components/shared/Wordmark";

export default function LoginPage() {
  const t = useTranslations("admin");
  const locale = useLocale();
  const [state, formAction, isPending] = useActionState(loginAction, {
    error: null,
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--paper)] p-4">
      <Card className="w-full max-w-md border-[var(--hairline)] bg-[var(--surface)] shadow-xl">
        <CardHeader className="space-y-2 text-center">
          <Wordmark className="text-3xl text-[var(--ink)]" />
          <CardTitle className="font-heading text-2xl text-[var(--ink)]">{t("login")}</CardTitle>
          <CardDescription className="text-[var(--muted-foreground)]">
            {t("email")} / {t("password")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[var(--ink)]">
                {t("email")}
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[var(--ink)]">
                {t("password")}
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                disabled={isPending}
              />
            </div>
            <input type="hidden" name="callbackUrl" defaultValue={`/${locale}/admin`} />
            {state.error && (
              <p className="text-sm text-[var(--destructive)]" role="alert">
                {t(state.error)}
              </p>
            )}
            <Button
              type="submit"
              className="w-full bg-[var(--ink)] text-[var(--paper)] hover:bg-black"
              disabled={isPending}
            >
              {isPending ? "…" : t("signIn")}
            </Button>
          </form>
          <Separator className="my-6 bg-[var(--hairline)]" />
          <p className="text-center text-xs text-[var(--muted-foreground)]">
            Puro Barbershop Admin
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
