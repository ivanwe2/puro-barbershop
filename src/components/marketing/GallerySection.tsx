import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { shop } from "@/lib/shop";
import { listGalleryImages } from "@/lib/assets";

// Static gallery: every image dropped into public/gallery/ is shown here.
// Instagram + TikTok links let visitors see more.
export default async function GallerySection() {
  const t = await getTranslations("gallery");
  const images = listGalleryImages();

  return (
    <section
      id="gallery"
      className="bg-[var(--ink)] px-[clamp(22px,5vw,40px)] py-[clamp(72px,11vw,120px)]"
    >
      <div className="mx-auto max-w-[1280px]">
        <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="mb-[18px] text-[13px] font-semibold tracking-[0.22em] text-[var(--paper)]/50 uppercase">
              {t("kicker")}
            </div>
            <h2 className="font-heading m-0 text-[clamp(36px,5vw,64px)] leading-none font-bold tracking-[-0.01em] text-[#f6f2eb]">
              {t("heading")}
            </h2>
          </div>
          <div className="flex items-center gap-5">
            <a
              href={shop.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="border-b border-[var(--paper)]/30 pb-1 text-[13px] font-semibold tracking-[0.08em] text-[var(--paper)]/80 uppercase transition-colors hover:text-[var(--paper)]"
            >
              {t("handle")} →
            </a>
            <a
              href={shop.tiktok}
              target="_blank"
              rel="noopener noreferrer"
              className="border-b border-[var(--paper)]/30 pb-1 text-[13px] font-semibold tracking-[0.08em] text-[var(--paper)]/80 uppercase transition-colors hover:text-[var(--paper)]"
            >
              TikTok →
            </a>
          </div>
        </div>

        {images.length > 0 ? (
          <div className="grid grid-cols-2 gap-[10px] sm:grid-cols-3 md:gap-[14px] lg:grid-cols-4">
            {images.map((src, i) => (
              <div
                key={src}
                className="group relative aspect-square overflow-hidden rounded-[2px] bg-[#1d1813]"
              >
                <Image
                  src={src}
                  alt={`Puro Barbershop — ${i + 1}`}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--paper)]/40">
            {/* Drop images into public/gallery/ to populate this section. */}
            {t("handle")}
          </p>
        )}

        <div className="mt-10 text-center">
          <a
            href={shop.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-[2px] border border-[var(--paper)]/40 px-6 py-3 text-[13px] font-bold tracking-[0.08em] text-[var(--paper)] uppercase transition-colors hover:bg-[var(--paper)] hover:text-[var(--ink)]"
          >
            {t("seeMoreOnInstagram")} →
          </a>
        </div>
      </div>
    </section>
  );
}
