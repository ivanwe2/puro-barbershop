import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { locales, defaultLocale } from "@/lib/i18n/config";

export default getRequestConfig(async ({ requestLocale }) => {
  // `requestLocale` is the locale from the matched [locale] segment (a Promise
  // in current next-intl). The deprecated `locale` arg was always undefined
  // here, which silently pinned the whole app to the default locale.
  const requested = await requestLocale;
  const locale = hasLocale(locales, requested) ? requested : defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
