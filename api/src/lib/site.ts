export const SITE = {
  name: "HomeVibe",
  email: process.env.ORDER_NOTIFY_EMAIL ?? "hello@homevibe.co.ke",
  phone: "+254 182 230 250",
  currency: {
    code: "KES",
    locale: "en-KE",
  },
} as const;

export function getSiteUrl(): string {
  const url = process.env.SITE_URL?.trim() || "https://homevibe.co.ke";
  return url.replace(/\/$/, "");
}

export function absoluteUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${getSiteUrl()}${normalized}`;
}
