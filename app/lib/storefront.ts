import { apiUrl } from "./api-client";
import { FAQ_LIST } from "../data/faq";
import { FEATURED_PRODUCT_COLUMNS } from "../data/products";
import { SITE } from "../config/site";

export type FeaturedColumnIds = {
  columnIndex: number;
  topProductId: number;
  bottomProductId: number | null;
};

export type SiteSettingsData = {
  name: string;
  tagline: string;
  email: string;
  phone: string;
  whatsapp: string;
  region: string;
  city: string;
  streetAddress: string;
  facebookUrl: string;
  instagramUrl: string;
  tiktokUrl: string;
};

export type FaqItemData = {
  id: number;
  question: string;
  answer: string;
  sortOrder: number;
};

export const DEFAULT_SITE_SETTINGS: SiteSettingsData = {
  name: SITE.name,
  tagline: SITE.tagline,
  email: SITE.email,
  phone: SITE.phone,
  whatsapp: SITE.whatsapp,
  region: SITE.region,
  city: SITE.city,
  streetAddress: SITE.streetAddress,
  facebookUrl: SITE.social.facebook,
  instagramUrl: SITE.social.instagram,
  tiktokUrl: SITE.social.tiktok,
};

const STATIC_FAQ: FaqItemData[] = FAQ_LIST.map((item, index) => ({
  id: index + 1,
  question: item.q,
  answer: item.a,
  sortOrder: index,
}));

const STATIC_FEATURED: FeaturedColumnIds[] = FEATURED_PRODUCT_COLUMNS.map((column, index) => ({
  columnIndex: index,
  topProductId: column.topId,
  bottomProductId: column.bottomId ?? null,
}));

async function fetchJson<T>(path: string, embeddedPath: string, fallback: T): Promise<T> {
  const endpoint = apiUrl(path) || embeddedPath;
  try {
    const res = await fetch(endpoint, { cache: "no-store" });
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}

export async function fetchFeaturedColumnsClient(): Promise<FeaturedColumnIds[]> {
  const data = await fetchJson<{ success?: boolean; columns?: FeaturedColumnIds[] }>(
    "/storefront/featured",
    "/api/storefront/featured",
    { columns: STATIC_FEATURED }
  );
  if (data.success && Array.isArray(data.columns) && data.columns.length > 0) {
    return data.columns;
  }
  return STATIC_FEATURED;
}

export async function fetchSiteSettingsClient(): Promise<SiteSettingsData> {
  const data = await fetchJson<{ success?: boolean; settings?: SiteSettingsData }>(
    "/storefront/settings",
    "/api/storefront/settings",
    { settings: DEFAULT_SITE_SETTINGS }
  );
  if (data.success && data.settings) return data.settings;
  return DEFAULT_SITE_SETTINGS;
}

export async function fetchFaqClient(): Promise<FaqItemData[]> {
  const data = await fetchJson<{ success?: boolean; items?: FaqItemData[] }>(
    "/storefront/faq",
    "/api/storefront/faq",
    { items: STATIC_FAQ }
  );
  if (data.success && Array.isArray(data.items) && data.items.length > 0) {
    return data.items;
  }
  return STATIC_FAQ;
}
