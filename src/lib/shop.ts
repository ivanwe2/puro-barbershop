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
  // Query-based embed works without an API key and centres on the address.
  mapsEmbed: `https://maps.google.com/maps?q=${encodeURIComponent(addressBg)}&z=16&hl=bg&output=embed`,
  mapsDirections: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addressBg)}`,
  mapsLink: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressBg)}`,
} as const;

export function shopAddress(locale: string): string {
  return locale === "bg" ? shop.address.bg : shop.address.en;
}
