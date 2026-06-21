import { getRequestConfig } from "next-intl/server";
import { locales } from "@/lib/i18n/config";

export default getRequestConfig(async ({ locale: incomingLocale }) => {
  const locale = incomingLocale ?? "bg";
  if (!locales.includes(locale as (typeof locales)[number])) {
    throw new Error(`Unsupported locale: ${locale}`);
  }
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
