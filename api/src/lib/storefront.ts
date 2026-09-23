import { getPrisma } from "./db.js";

export type FeaturedSlotRecord = {
  columnIndex: number;
  topProductId: number;
  bottomProductId: number | null;
  topProduct: { id: number; name: string; primaryPhotoId: string };
  bottomProduct: { id: number; name: string; primaryPhotoId: string } | null;
};

export type FeaturedSlotInput = {
  columnIndex: number;
  topProductId: number;
  bottomProductId?: number | null;
};

export type SiteSettings = {
  name: string;
  tagline: string;
  email: string;
  phone: string;
  whatsapp: string;
  region: string;
  city: string;
  facebookUrl: string;
  instagramUrl: string;
  tiktokUrl: string;
};

export type FaqItemRecord = {
  id: number;
  question: string;
  answer: string;
  sortOrder: number;
};

export const SITE_SETTING_KEYS = [
  "name",
  "tagline",
  "email",
  "phone",
  "whatsapp",
  "region",
  "city",
  "facebook_url",
  "instagram_url",
  "tiktok_url",
] as const;

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  name: "HomeVibe",
  tagline: "Kitchen & gym gear you can trust",
  email: "hello@homevibe.co.ke",
  phone: "+254 182 230 250",
  whatsapp: "254182230250",
  region: "East & Central Africa",
  city: "Nairobi",
  facebookUrl: "https://facebook.com/homevibe",
  instagramUrl: "https://instagram.com/homevibe",
  tiktokUrl: "https://tiktok.com/@homevibe",
};

function mapSiteSettings(rows: { key: string; value: string }[]): SiteSettings {
  const byKey = new Map(rows.map((row) => [row.key, row.value]));
  return {
    name: byKey.get("name") ?? DEFAULT_SITE_SETTINGS.name,
    tagline: byKey.get("tagline") ?? DEFAULT_SITE_SETTINGS.tagline,
    email: byKey.get("email") ?? DEFAULT_SITE_SETTINGS.email,
    phone: byKey.get("phone") ?? DEFAULT_SITE_SETTINGS.phone,
    whatsapp: byKey.get("whatsapp") ?? DEFAULT_SITE_SETTINGS.whatsapp,
    region: byKey.get("region") ?? DEFAULT_SITE_SETTINGS.region,
    city: byKey.get("city") ?? DEFAULT_SITE_SETTINGS.city,
    facebookUrl: byKey.get("facebook_url") ?? DEFAULT_SITE_SETTINGS.facebookUrl,
    instagramUrl: byKey.get("instagram_url") ?? DEFAULT_SITE_SETTINGS.instagramUrl,
    tiktokUrl: byKey.get("tiktok_url") ?? DEFAULT_SITE_SETTINGS.tiktokUrl,
  };
}

function siteSettingsToDb(settings: Partial<SiteSettings>): Record<string, string> {
  const map: Record<string, string> = {};
  if (settings.name !== undefined) map.name = settings.name;
  if (settings.tagline !== undefined) map.tagline = settings.tagline;
  if (settings.email !== undefined) map.email = settings.email;
  if (settings.phone !== undefined) map.phone = settings.phone;
  if (settings.whatsapp !== undefined) map.whatsapp = settings.whatsapp;
  if (settings.region !== undefined) map.region = settings.region;
  if (settings.city !== undefined) map.city = settings.city;
  if (settings.facebookUrl !== undefined) map.facebook_url = settings.facebookUrl;
  if (settings.instagramUrl !== undefined) map.instagram_url = settings.instagramUrl;
  if (settings.tiktokUrl !== undefined) map.tiktok_url = settings.tiktokUrl;
  return map;
}

export async function listFeaturedSlots(): Promise<FeaturedSlotRecord[]> {
  const prisma = getPrisma();
  if (!prisma) return [];

  const rows = await prisma.featuredHomeSlot.findMany({
    include: {
      topProduct: { select: { id: true, name: true, primaryPhotoId: true } },
      bottomProduct: { select: { id: true, name: true, primaryPhotoId: true } },
    },
    orderBy: { columnIndex: "asc" },
  });

  return rows.map((row) => ({
    columnIndex: row.columnIndex,
    topProductId: row.topProductId,
    bottomProductId: row.bottomProductId,
    topProduct: row.topProduct,
    bottomProduct: row.bottomProduct,
  }));
}

export async function updateFeaturedSlots(slots: FeaturedSlotInput[]): Promise<FeaturedSlotRecord[]> {
  const prisma = getPrisma();
  if (!prisma) throw new Error("Database unavailable");

  for (const slot of slots) {
    const top = await prisma.product.findUnique({ where: { id: slot.topProductId } });
    if (!top) throw new Error(`Product ${slot.topProductId} not found.`);

    if (slot.bottomProductId != null) {
      const bottom = await prisma.product.findUnique({ where: { id: slot.bottomProductId } });
      if (!bottom) throw new Error(`Product ${slot.bottomProductId} not found.`);
    }

    await prisma.featuredHomeSlot.upsert({
      where: { columnIndex: slot.columnIndex },
      create: {
        columnIndex: slot.columnIndex,
        topProductId: slot.topProductId,
        bottomProductId: slot.bottomProductId ?? null,
      },
      update: {
        topProductId: slot.topProductId,
        bottomProductId: slot.bottomProductId ?? null,
      },
    });
  }

  return listFeaturedSlots();
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const prisma = getPrisma();
  if (!prisma) return DEFAULT_SITE_SETTINGS;

  const rows = await prisma.siteSetting.findMany();
  if (rows.length === 0) return DEFAULT_SITE_SETTINGS;
  return mapSiteSettings(rows);
}

export async function updateSiteSettings(partial: Partial<SiteSettings>): Promise<SiteSettings> {
  const prisma = getPrisma();
  if (!prisma) throw new Error("Database unavailable");

  const entries = Object.entries(siteSettingsToDb(partial));
  for (const [key, value] of entries) {
    await prisma.siteSetting.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
  }

  return getSiteSettings();
}

export async function listFaqItems(): Promise<FaqItemRecord[]> {
  const prisma = getPrisma();
  if (!prisma) return [];

  const rows = await prisma.faqItem.findMany({ orderBy: [{ sortOrder: "asc" }, { id: "asc" }] });
  return rows.map((row) => ({
    id: row.id,
    question: row.question,
    answer: row.answer,
    sortOrder: row.sortOrder,
  }));
}

export async function createFaqItem(input: {
  question: string;
  answer: string;
  sortOrder?: number;
}): Promise<FaqItemRecord> {
  const prisma = getPrisma();
  if (!prisma) throw new Error("Database unavailable");

  const question = input.question.trim();
  const answer = input.answer.trim();
  if (!question || !answer) throw new Error("Question and answer are required.");

  let sortOrder = input.sortOrder;
  if (sortOrder === undefined) {
    const max = await prisma.faqItem.aggregate({ _max: { sortOrder: true } });
    sortOrder = (max._max.sortOrder ?? -1) + 1;
  }

  const row = await prisma.faqItem.create({
    data: { question, answer, sortOrder },
  });

  return { id: row.id, question: row.question, answer: row.answer, sortOrder: row.sortOrder };
}

export async function updateFaqItem(
  id: number,
  input: { question?: string; answer?: string; sortOrder?: number }
): Promise<FaqItemRecord | null> {
  const prisma = getPrisma();
  if (!prisma) throw new Error("Database unavailable");

  const existing = await prisma.faqItem.findUnique({ where: { id } });
  if (!existing) return null;

  const row = await prisma.faqItem.update({
    where: { id },
    data: {
      question: input.question?.trim() ?? undefined,
      answer: input.answer?.trim() ?? undefined,
      sortOrder: input.sortOrder,
    },
  });

  return { id: row.id, question: row.question, answer: row.answer, sortOrder: row.sortOrder };
}

export async function deleteFaqItem(id: number): Promise<boolean> {
  const prisma = getPrisma();
  if (!prisma) throw new Error("Database unavailable");

  const result = await prisma.faqItem.deleteMany({ where: { id } });
  return result.count > 0;
}

export async function seedDefaultSiteSettingsIfEmpty(): Promise<void> {
  const prisma = getPrisma();
  if (!prisma) return;

  const count = await prisma.siteSetting.count();
  if (count > 0) return;

  const defaults = siteSettingsToDb(DEFAULT_SITE_SETTINGS);
  await prisma.siteSetting.createMany({
    data: Object.entries(defaults).map(([key, value]) => ({ key, value })),
  });
}
