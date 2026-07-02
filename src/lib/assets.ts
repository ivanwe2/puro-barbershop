import fs from "node:fs";
import path from "node:path";

// Server-only helpers that resolve owner-supplied images dropped into /public
// by naming convention. No blob storage: assets live on disk and are matched
// here, so the site degrades gracefully to placeholders until files exist.

const PUBLIC_DIR = path.join(process.cwd(), "public");
const IMAGE_EXTS = ["jpg", "jpeg", "png", "webp", "avif"] as const;

/**
 * Return the web path (e.g. "/hero.jpg") for the first existing file named
 * `<name>.<ext>` inside `public/<dir>`, trying common image extensions.
 * Returns null when none exist.
 */
function firstExisting(dir: string, name: string): string | null {
  for (const ext of IMAGE_EXTS) {
    const abs = path.join(PUBLIC_DIR, dir, `${name}.${ext}`);
    if (fs.existsSync(abs)) {
      const rel = dir ? `${dir}/${name}.${ext}` : `${name}.${ext}`;
      return `/${rel}`;
    }
  }
  return null;
}

/** Slugify a display name for use as a filename (e.g. "Seney" -> "seney"). */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Hero background: drop `public/hero.{jpg,png,webp,…}`. */
export function resolveHeroImage(): string | null {
  return firstExisting("", "hero");
}

/**
 * Barber portrait fallback: drop `public/barbers/<slug>.{jpg,png,…}` where
 * `<slug>` is the English name slugified (e.g. `public/barbers/seney.jpg`).
 * Used only when the barber has no explicit `photoUrl` set in the DB.
 */
export function resolveBarberPhoto(nameEn: string): string | null {
  return firstExisting("barbers", slugify(nameEn));
}
