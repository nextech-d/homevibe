import "server-only";

import { getBrandBySlug, type Brand } from "../data/brands";
import { getPrisma } from "./db";

export type BrandSeo = Brand & {
  metaTitle: string | null;
  metaDescription: string | null;
};

function mapDbBrand(brand: {
  name: string;
  slug: string;
  tier: "signature" | "partner";
  origin: string;
  metaTitle: string | null;
  metaDescription: string | null;
}): BrandSeo {
  return {
    name: brand.name,
    slug: brand.slug,
    tier: brand.tier,
    origin: brand.origin,
    metaTitle: brand.metaTitle,
    metaDescription: brand.metaDescription,
  };
}

export async function listBrandsForSitemap(): Promise<{ slug: string }[]> {
  if (!process.env.DATABASE_URL) {
    return [];
  }

  const prisma = getPrisma();
  if (!prisma) {
    return [];
  }

  try {
    return await prisma.brand.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { slug: true },
    });
  } catch (error) {
    console.error("Failed to load brands for sitemap:", error);
    return [];
  }
}

export async function getBrandBySlugFromDb(slug: string): Promise<BrandSeo | undefined> {
  const normalized = slug.toLowerCase();

  if (!process.env.DATABASE_URL) {
    const staticBrand = getBrandBySlug(normalized);
    return staticBrand
      ? { ...staticBrand, metaTitle: null, metaDescription: null }
      : undefined;
  }

  const prisma = getPrisma();
  if (!prisma) {
    const staticBrand = getBrandBySlug(normalized);
    return staticBrand
      ? { ...staticBrand, metaTitle: null, metaDescription: null }
      : undefined;
  }

  try {
    const brand = await prisma.brand.findUnique({ where: { slug: normalized } });
    if (brand) return mapDbBrand(brand);
  } catch (error) {
    console.error("Failed to load brand from database:", error);
  }

  const staticBrand = getBrandBySlug(normalized);
  return staticBrand
    ? { ...staticBrand, metaTitle: null, metaDescription: null }
    : undefined;
}
