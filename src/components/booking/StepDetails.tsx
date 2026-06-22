"use client";

import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Link } from "@/lib/i18n/routing";

const detailsSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().max(255),
  phone: z.string().min(7).max(30),
  notes: z.string().max(500).optional(),
  consent: z.boolean().refine((v) => v === true, {
    message: "consent_required",
  }),
});

type DetailsForm = z.infer<typeof detailsSchema>;

interface StepDetailsProps {
  locale: string;
  onSubmit: (data: {
    name: string;
    email: string;
    phone: string;
    notes?: string | undefined;
    locale: string;
  }) => void;
  isSubmitting: boolean;
  error: string | null;
}

export default function StepDetails({ locale, onSubmit, isSubmitting, error }: StepDetailsProps) {
  const t = useTranslations("booking");

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<DetailsForm>({
    resolver: zodResolver(detailsSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      notes: "",
      consent: false,
    },
  });

  const consentChecked = watch("consent");

  const onFormSubmit = handleSubmit((data) => {
    const { consent: _c, ...rest } = data;
    onSubmit({ ...rest, locale });
  });

  return (
    <div>
      <h2 className="text-foreground mb-6 text-2xl font-semibold tracking-tight">
        {t("stepDetails")}
      </h2>
      {error && (
        <div className="border-destructive/50 bg-destructive/10 mb-6 rounded-lg border p-4">
          <p className="text-destructive text-sm" role="alert">
            {error === "slotTaken" ? t("slotTaken") : t("booking_error")}
          </p>
        </div>
      )}
      <form onSubmit={onFormSubmit} className="mx-auto max-w-md space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name">{t("name")} *</Label>
          <Input
            id="name"
            placeholder={t("name")}
            {...register("name")}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "name-error" : undefined}
          />
          {errors.name && (
            <p id="name-error" className="text-destructive text-sm" role="alert">
              {errors.name.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">{t("email")} *</Label>
          <Input
            id="email"
            type="email"
            placeholder={t("email")}
            {...register("email")}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
          />
          {errors.email && (
            <p id="email-error" className="text-destructive text-sm" role="alert">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">{t("phone")} *</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+359 888 123 456"
            {...register("phone")}
            aria-invalid={!!errors.phone}
            aria-describedby={errors.phone ? "phone-error" : undefined}
          />
          {errors.phone && (
            <p id="phone-error" className="text-destructive text-sm" role="alert">
              {errors.phone.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">{t("notes")}</Label>
          <Textarea id="notes" placeholder={t("notes")} {...register("notes")} rows={3} />
        </div>

        <Separator />

        <div className="flex items-start gap-3">
          <Checkbox
            id="consent"
            checked={consentChecked}
            onCheckedChange={(checked) => {
              setValue("consent", checked === true, { shouldValidate: true });
            }}
            aria-invalid={!!errors.consent}
            aria-describedby={errors.consent ? "consent-error" : undefined}
          />
          <label htmlFor="consent" className="text-muted-foreground text-sm leading-5">
            {t("consent")}{" "}
            <Link
              href="/legal/privacy"
              className="text-accent hover:text-accent/80 underline underline-offset-4"
            >
              {t("privacy")}
            </Link>{" "}
            {locale === "bg" ? "и" : "and"}{" "}
            <Link
              href="/legal/terms"
              className="text-accent hover:text-accent/80 underline underline-offset-4"
            >
              {t("terms")}
            </Link>
          </label>
        </div>
        {errors.consent && (
          <p id="consent-error" className="text-destructive text-sm" role="alert">
            {t("consent")}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "..." : t("confirm")}
        </Button>
      </form>
    </div>
  );
}
