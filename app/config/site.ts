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
  { label: "Free same-day delivery in Nairobi", detail: "Same day, anywhere in Nairobi" },
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
  { id: "delivery", text: "Free same-day delivery in Nairobi, within 24 hours elsewhere in Kenya" },
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

export type WhyBuyPoint = { lead: string; body: string };

/**
 * The product page's "Why buy from us" points: first the delivery point
 * (WHY_BUY_FIRST_POINT, chosen by whether we install that subcategory, per
 * INSTALLATION_WORDING), then the shared points, then the group's own, by
 * subcategory slug through WHY_BUY_GROUP below. Washer-only wording (drain
 * pumps, water pressure) used to show on every product, and installation was
 * promised on products we don't install.
 */
const WHY_BUY_DELIVERY =
  "Delivery is free and same-day in Nairobi, and within 24 hours elsewhere in Kenya.";

export const WHY_BUY_FIRST_POINT = {
  installed: {
    lead: "We install it properly.",
    body: `In Nairobi our technicians install it for free: unboxed, positioned, connected and tested with you (parts paid separately). ${WHY_BUY_DELIVERY}`,
  },
  delivered: { lead: "We deliver fast.", body: WHY_BUY_DELIVERY },
} as const satisfies Record<string, WhyBuyPoint>;

export const WHY_BUY_SHARED_POINTS: readonly WhyBuyPoint[] = [
  {
    lead: "We service what we sell.",
    body: "Twelve months from us, with our own technicians. Where a brand adds a longer manufacturer warranty, the product page says so. No third-party service centre to chase.",
  },
];

export const WHY_BUY_GROUP_POINTS = {
  washers: [
    {
      lead: "We stock the parts.",
      body: "Drain pumps, door seals, heating elements — we keep them and we'll tell you what a repair costs before you commit to it.",
    },
    {
      lead: "We'll tell you when not to buy.",
      body: "If your water pressure won't run a front loader, or the machine is too big for your kitchen, we'd rather say so now than deal with it after delivery.",
    },
  ],
  tvs: [
    {
      lead: "We mount it properly.",
      body: `In Nairobi our technicians wall-mount it for free. Tell us your wall type and we'll bring the right fixings (bracket paid separately). ${WHY_BUY_DELIVERY}`,
    },
    {
      lead: "We'll tell you when not to buy.",
      body: "If the size is wrong for your room, or an app you need isn't on that TV's platform, we'd rather say so now than deal with it after delivery.",
    },
  ],
  fridges: [
    {
      lead: "We protect the compressor.",
      body: "Voltage swings when stima comes back are what damage compressors. We stock stabilisers and will tell you which one your fridge needs.",
    },
    {
      lead: "We'll tell you when not to buy.",
      body: "If it won't fit through your door or into your kitchen space, we'd rather say so now than deal with it after delivery.",
    },
  ],
  generic: [
    {
      lead: "We'll tell you when not to buy.",
      body: "If it won't fit your space or suit your power supply, we'd rather say so now than deal with it after delivery.",
    },
  ],
} as const satisfies Record<string, readonly WhyBuyPoint[]>;

/** Subcategory slug to its group above; a slug missing here gets "generic". */
export const WHY_BUY_GROUP: Readonly<Record<string, keyof typeof WHY_BUY_GROUP_POINTS>> = {
  laundry: "washers",
  tvs: "tvs",
  refrigerators: "fridges",
  freezers: "fridges",
  "wine-cellars": "fridges",
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
