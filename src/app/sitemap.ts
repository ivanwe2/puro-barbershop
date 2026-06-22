import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.AUTH_URL || "https://purobarbershop.com";
  const locales = ["bg", "en"];
  const pages = ["", "/legal/privacy", "/legal/terms", "/legal/cookie-info"];

  return pages.flatMap((page) =>
    locales.map((locale) => ({
      url: `${baseUrl}/${locale}${page}`,
      lastModified: new Date(),
      changeFrequency: page === "" ? "daily" : ("monthly" as const),
      priority: page === "" ? 1 : 0.5,
    })),
  );
}
