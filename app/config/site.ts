export const SITE = {
  name: "HomeVibe",
  tagline: "Kitchen & gym gear you can trust",
  demoMode: process.env.NEXT_PUBLIC_DEMO_MODE === "true",
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "254182230250",
  social: {
    facebook: process.env.NEXT_PUBLIC_FACEBOOK_URL ?? "https://facebook.com/homevibe",
    instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? "https://instagram.com/homevibe",
    tiktok: process.env.NEXT_PUBLIC_TIKTOK_URL ?? "https://tiktok.com/@homevibe",
  },
  /** Meta (Facebook) Pixel ID. Empty disables the pixel entirely. */
  metaPixelId: process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() ?? "",
  email: "homevibekenya@gmail.com",
  phone: "+254 182 230 250",
  region: "Kenya",
  city: "Nairobi",
  currency: {
    code: "KES",
    locale: "en-KE",
    /** Written out rather than taken from the locale: see formatPrice. */
    symbol: "Ksh",
  },
} as const;

export const TRUST_BADGES = [
  { label: "Free same-day delivery in Nairobi", detail: "Complimentary across Nairobi & environs" },
  { label: "12-month warranty", detail: "Our own technicians, parts & labour" },
  { label: "Free installation in Nairobi", detail: "Certified technicians" },
  { label: "Pay by M-Pesa or cash on delivery in Nairobi", detail: "Also bank transfer, or cash on delivery in Nairobi" },
] as const;

/**
 * The product page's trust points: one plain line each, in the order shown.
 * Separate from TRUST_BADGES above, which the homepage hero also uses.
 * Every line is checked by the claims guard (app/lib/claims.ts). The
 * installation line comes from INSTALLATION_WORDING, per subcategory.
 */
export const PRODUCT_TRUST_POINTS = [
  { id: "delivery", text: "Free delivery in Nairobi, delivery countrywide" },
  { id: "warranty", text: "12-month warranty on parts and labour, serviced by our own technicians" },
  { id: "payment", text: "Pay by M-Pesa, bank transfer, or cash on delivery in Nairobi" },
] as const;

const FREE_INSTALLATION = "Free installation in Nairobi (parts paid separately)";

/**
 * Where we install what we sell, by subcategory slug, and what the product
 * page says about it. Confirmed by the client 2026-10-17: installation labour
 * is free within Nairobi only, TV wall mounting included; brackets and any
 * parts are extra. A subcategory missing here gets no installation line.
 *
 * By subcategory rather than category: Heating & Cooling holds plug-in heaters
 * as well as air conditioners. The empty ones are listed so a product added
 * there later gets the line without a code change.
 */
export const INSTALLATION_WORDING: Readonly<Record<string, string>> = {
  tvs: "Free wall mounting in Nairobi (bracket not included)",
  laundry: FREE_INSTALLATION,
  refrigerators: FREE_INSTALLATION,
  "air-conditioners": FREE_INSTALLATION,
  "hand-dryer": FREE_INSTALLATION,
  freezers: FREE_INSTALLATION,
  dishwashers: FREE_INSTALLATION,
  cooktops: FREE_INSTALLATION,
  rangetops: FREE_INSTALLATION,
  "wine-cellars": FREE_INSTALLATION,
};

/**
 * Subcategories, by slug, that may fill each other's related items when one
 * has too few. A subcategory not listed here only ever shows its own - a
 * fridge page used to show microwaves because both were "Kitchen".
 */
export const RELATED_FAMILIES: readonly (readonly string[])[] = [
  ["refrigerators", "freezers", "wine-cellars"],
  ["ovens-ranges", "rangetops", "cooktops"],
  ["brewers", "espresso-machines"],
];

/**
 * Catch-all subcategories whose products have nothing to do with one another
 * (a sealant, a jump starter, washer footpads): their pages show no related
 * items at all.
 */
export const RELATED_HIDDEN_SUBCATEGORIES: readonly string[] = ["adhesives-and-sealants"];

/**
 * Add-ons, by subcategory slug: products genuinely useful with what's on the
 * page, shown in their own section below the related items. Only while they're
 * published and in stock.
 */
export const PRODUCT_ADD_ONS: Readonly<
  Record<string, { heading: string; productIds: readonly number[] }>
> = {
  laundry: { heading: "Useful with this washer", productIds: [116] },
};
