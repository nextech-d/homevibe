import "server-only";

import { cache } from "react";

import { type Appliance } from "../data/products";
import { getPrisma } from "./db";
import { mapDbProductToAppliance } from "./mapProduct";

const productInclude = {
  brand: true,
  subcategory: { include: { category: true } },
} as const;

/**
 * Load published products from Postgres. Memoised per request: a category page
 * renders the grid and the structured data describing it from one query.
 *
 * An unreachable database yields an empty catalogue, not the demo one: these
 * results are server-rendered, and a page of invented products at invented
 * prices is worse than a page with none.
 */
export const getInventory = cache(async (): Promise<Appliance[]> => {
  if (!process.env.DATABASE_URL) {
    return [];
  }

  const prisma = getPrisma();
  if (!prisma) {
    return [];
  }

  try {
    const rows = await prisma.product.findMany({
      where: { isPublished: true },
      include: productInclude,
      orderBy: { id: "asc" },
    });

    if (rows.length === 0) {
      return [];
    }

    return rows.map(mapDbProductToAppliance);
  } catch (error) {
    console.error("Failed to load inventory from database:", error);
    return [];
  }
});

/**
 * Slugs and modification dates for the sitemap. A separate query from
 * getInventory because the sitemap wants two columns per product and no images,
 * descriptions or relations.
 */
export const listProductsForSitemap = cache(
  async (): Promise<{ slug: string; id: number; updatedAt: Date }[]> => {
    if (!process.env.DATABASE_URL) return [];

    const prisma = getPrisma();
    if (!prisma) return [];

    try {
      return await prisma.product.findMany({
        where: { isPublished: true },
        select: { slug: true, id: true, updatedAt: true },
        orderBy: { id: "asc" },
      });
    } catch (error) {
      console.error("Failed to load products for sitemap:", error);
      return [];
    }
  }
);

export const getPublishedProduct = cache(async (id: number): Promise<Appliance | null> => {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  const prisma = getPrisma();
  if (!prisma) {
    return null;
  }

  try {
    const row = await prisma.product.findFirst({
      where: { id, isPublished: true },
      include: productInclude,
    });
    return row ? mapDbProductToAppliance(row) : null;
  } catch (error) {
    console.error("Failed to load product from database:", error);
    return null;
  }
});

/** Memoised too - the product layout and page each resolve the same param. */
export const getPublishedProductByParam = cache(async (param: string): Promise<Appliance | null> => {
  const trimmed = param.trim();
  if (!trimmed) return null;
  if (/^\d+$/.test(trimmed)) {
    return getPublishedProduct(Number(trimmed));
  }

  if (!process.env.DATABASE_URL) {
    return null;
  }

  const prisma = getPrisma();
  if (!prisma) {
    return null;
  }

  try {
    const row = await prisma.product.findFirst({
      where: { slug: trimmed.toLowerCase(), isPublished: true },
      include: productInclude,
    });
    return row ? mapDbProductToAppliance(row) : null;
  } catch (error) {
    console.error("Failed to load product from database:", error);
    return null;
  }
});
