import { useTranslations } from "next-intl";

export default function GalleryPlaceholder() {
  const t = useTranslations("gallery");

  return (
    <section id="gallery" className="mx-auto max-w-7xl px-4 py-24 text-center sm:px-6 lg:px-8">
      <h2 className="font-heading text-foreground text-3xl font-semibold sm:text-4xl">
        {t("title")}
      </h2>
      <div className="border-border bg-muted mt-8 h-64 w-full overflow-hidden rounded-lg border">
        <div className="text-muted-foreground flex h-full items-center justify-center">
          [PLACEHOLDER:gallery_content]
        </div>
      </div>
    </section>
  );
}
