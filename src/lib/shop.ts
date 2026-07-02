/**
 * Stable, public shop contact details. Kept as plain constants (not env) so the
 * same values are used everywhere on the server and client without plumbing.
 */
const addressBg = "Бул. Христо Ботев 114, Пловдив, България";
const addressEn = "114 Hristo Botev Blvd, Plovdiv, Bulgaria";

export const shop = {
  legalName: "EXACTO Ltd (ЕКСАКТО ЕООД)",
  uic: "208808320",
  email: "seneymurad111@gmail.com",
  phone: "+359892919649",
  phoneDisplay: "+359 892 919 649",
  phoneHref: "tel:+359892919649",
  whatsappHref: "https://wa.me/359892919649",
  instagram: "https://www.instagram.com/puro.barbershop/",
  tiktok: "https://www.tiktok.com/@puro.barbershop",
  address: { bg: addressBg, en: addressEn },
  // Exact Google Business listing coordinates.
  lat: 42.13604614922421,
  lng: 24.755346576487906,
  // Official "Embed a map" src from the Google Business listing.
  mapsEmbed:
    "https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d2958.6653864137274!2d24.755346576487906!3d42.13604614922421!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14acd1127ec62ce1%3A0x125e0f977733e0a8!2sPuro%20Barbershop!5e0!3m2!1sbg!2sbg!4v1783030206431!5m2!1sbg!2sbg",
  // Route to the named listing (shows "Puro Barbershop" as the destination),
  // pinned to the exact coordinates via destination_place_id-free lat/lng.
  mapsDirections: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    "Puro Barbershop, Бул. Христо Ботев 114, Пловдив",
  )}`,
  // Canonical Google Maps share link for the business listing.
  mapsLink: "https://maps.app.goo.gl/2FXN2S8dZhwmGZR59",
} as const;

export function shopAddress(locale: string): string {
  return locale === "bg" ? shop.address.bg : shop.address.en;
}
