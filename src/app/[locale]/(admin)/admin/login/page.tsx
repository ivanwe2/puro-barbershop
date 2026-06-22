"use client";

import { useActionState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { loginAction } from "@/actions/admin/login";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function LoginPage() {
  const t = useTranslations("admin");
  const [state, formAction, isPending] = useActionState(loginAction, {
    error: null,
  });

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <Card className="border-border w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="font-heading text-foreground text-2xl">{t("login")}</CardTitle>
          <CardDescription className="text-muted-foreground">
            {t("email")} / {t("password")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("email")}</Label>
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
              <Label htmlFor="password">{t("password")}</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                disabled={isPending}
              />
            </div>
            <input type="hidden" name="callbackUrl" defaultValue={""} />
            {state.error && (
              <p className="text-destructive text-sm" role="alert">
                {t(state.error)}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "..." : t("signIn")}
            </Button>
          </form>
          <Separator className="my-6" />
          <p className="text-muted-foreground text-center text-xs">Puro Barbershop Admin</p>
        </CardContent>
      </Card>
    </div>
  );
}
