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
  email: "hello@homevibe.co.ke",
  phone: "+254 182 230 250",
  region: "East & Central Africa",
  city: "Nairobi",
  currency: {
    code: "KES",
    locale: "en-KE",
  },
} as const;

export const TRUST_BADGES = [
  { label: "Free Delivery within Nairobi", detail: "Complimentary across Nairobi & environs" },
  { label: "3-Year Warranty", detail: "Parts & labor included" },
  { label: "Installation Included", detail: "Certified technicians" },
  { label: "M-Pesa Accepted", detail: "Pay by M-Pesa, card, or bank transfer" },
] as const;
