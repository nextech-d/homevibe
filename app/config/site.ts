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
  { label: "Free delivery within Nairobi", detail: "Complimentary across Nairobi & environs" },
  { label: "12-month in-house warranty", detail: "Our own technicians, parts & labour" },
  { label: "Installation included", detail: "Certified technicians" },
  { label: "M-Pesa accepted", detail: "Also bank transfer, or cash on delivery in Nairobi" },
] as const;
