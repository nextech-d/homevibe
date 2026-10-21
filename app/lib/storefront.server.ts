import "server-only";

import { cache } from "react";

import { getPrisma } from "./db";
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

const DEFAULT_SETTINGS: SiteSettingsData = {
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

function mapSiteSettings(rows: { key: string; value: string }[]): SiteSettingsData {
  const byKey = new Map(rows.map((row) => [row.key, row.value]));
  return {
    name: byKey.get("name") ?? DEFAULT_SETTINGS.name,
    tagline: byKey.get("tagline") ?? DEFAULT_SETTINGS.tagline,
    email: byKey.get("email") ?? DEFAULT_SETTINGS.email,
    phone: byKey.get("phone") ?? DEFAULT_SETTINGS.phone,
    whatsapp: byKey.get("whatsapp") ?? DEFAULT_SETTINGS.whatsapp,
    region: byKey.get("region") ?? DEFAULT_SETTINGS.region,
    city: byKey.get("city") ?? DEFAULT_SETTINGS.city,
    streetAddress: byKey.get("street_address") ?? DEFAULT_SETTINGS.streetAddress,
    facebookUrl: byKey.get("facebook_url") ?? DEFAULT_SETTINGS.facebookUrl,
    instagramUrl: byKey.get("instagram_url") ?? DEFAULT_SETTINGS.instagramUrl,
    tiktokUrl: byKey.get("tiktok_url") ?? DEFAULT_SETTINGS.tiktokUrl,
  };
}

export async function getFeaturedColumnIds(): Promise<FeaturedColumnIds[]> {
  if (!process.env.DATABASE_URL) {
    return FEATURED_PRODUCT_COLUMNS.map((column, index) => ({
      columnIndex: index,
      topProductId: column.topId,
      bottomProductId: column.bottomId ?? null,
    }));
  }

  const prisma = getPrisma();
  if (!prisma) {
    return FEATURED_PRODUCT_COLUMNS.map((column, index) => ({
      columnIndex: index,
      topProductId: column.topId,
      bottomProductId: column.bottomId ?? null,
    }));
  }

  try {
    const rows = await prisma.featuredHomeSlot.findMany({ orderBy: { columnIndex: "asc" } });
    if (rows.length === 0) {
      return FEATURED_PRODUCT_COLUMNS.map((column, index) => ({
        columnIndex: index,
        topProductId: column.topId,
        bottomProductId: column.bottomId ?? null,
      }));
    }
    return rows.map((row) => ({
      columnIndex: row.columnIndex,
      topProductId: row.topProductId,
      bottomProductId: row.bottomProductId,
    }));
  } catch (error) {
    console.error("Failed to load featured slots:", error);
    return FEATURED_PRODUCT_COLUMNS.map((column, index) => ({
      columnIndex: index,
      topProductId: column.topId,
      bottomProductId: column.bottomId ?? null,
    }));
  }
}

/**
 * The storefront's settings: the admin-set rows, falling back to config.
 *
 * Memoised per request, because the root layout (for the WhatsApp number the
 * product links use), the footer and the metadata all ask for it - one query,
 * and so one answer, for all of them.
 */
export const getSiteSettingsData = cache(async (): Promise<SiteSettingsData> => {
  if (!process.env.DATABASE_URL) return DEFAULT_SETTINGS;

  const prisma = getPrisma();
  if (!prisma) return DEFAULT_SETTINGS;

  try {
    const rows = await prisma.siteSetting.findMany();
    if (rows.length === 0) return DEFAULT_SETTINGS;
    return mapSiteSettings(rows);
  } catch (error) {
    console.error("Failed to load site settings:", error);
    return DEFAULT_SETTINGS;
  }
});

export async function getFaqItemsData(): Promise<FaqItemData[]> {
  if (!process.env.DATABASE_URL) {
    return FAQ_LIST.map((item, index) => ({
      id: index + 1,
      question: item.q,
      answer: item.a,
      sortOrder: index,
    }));
  }

  const prisma = getPrisma();
  if (!prisma) {
    return FAQ_LIST.map((item, index) => ({
      id: index + 1,
      question: item.q,
      answer: item.a,
      sortOrder: index,
    }));
  }

  try {
    const rows = await prisma.faqItem.findMany({ orderBy: [{ sortOrder: "asc" }, { id: "asc" }] });
    if (rows.length === 0) {
      return FAQ_LIST.map((item, index) => ({
        id: index + 1,
        question: item.q,
        answer: item.a,
        sortOrder: index,
      }));
    }
    return rows.map((row) => ({
      id: row.id,
      question: row.question,
      answer: row.answer,
      sortOrder: row.sortOrder,
    }));
  } catch (error) {
    console.error("Failed to load FAQ:", error);
    return FAQ_LIST.map((item, index) => ({
      id: index + 1,
      question: item.q,
      answer: item.a,
      sortOrder: index,
    }));
  }
}
