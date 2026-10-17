import "server-only";

import { cache } from "react";

import { type Appliance } from "../data/products";
import { getPrisma } from "./db";
import { mapDbProductToAppliance } from "./mapProduct";
import { relatedSubcategories } from "./inventory";
import { PRODUCT_ADD_ONS } from "../config/site";

const productInclude = {
  brand: true,
  subcategory: { include: { category: true } },
} as const;

/** One product, for its own page - the list query has no use for the FAQs. */
const productDetailInclude = {
  ...productInclude,
  faqs: { orderBy: { sortOrder: "asc" } },
} as const;

/**
 * Load published products from Postgres. Memoised per request: a category page
 * renders the grid and the structured data describing it from one query.
 *
 * Nothing to read - no DATABASE_URL (a Preview build) - yields an empty
 * catalogue, never the demo one: a page of invented products at invented
 * prices is worse than a page with none. A query that fails throws, as
 * getPublishedProduct does: these pages are regenerated in the background, and a
 * render that throws leaves the last good page in place, where an empty grid
 * would have replaced it with one that looks like we sell nothing.
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
    throw new Error("Failed to load inventory from database", { cause: error });
  }
});

/**
 * The products the homepage's featured grid can show, and no others: every
 * published product flagged as featured, plus the ones in the featured slots.
 * featuredSelection() picks from these exactly as it would from the whole
 * catalogue - the flagged ones if there are any, else the slots in order - so
 * the homepage no longer loads all 139 products to render nine.
 */
export async function getFeaturedCandidates(
  columns: { topProductId: number; bottomProductId: number | null }[]
): Promise<Appliance[]> {
  if (!process.env.DATABASE_URL) {
    return [];
  }

  const prisma = getPrisma();
  if (!prisma) {
    return [];
  }

  const slotIds = columns.flatMap((column) =>
    column.bottomProductId === null
      ? [column.topProductId]
      : [column.topProductId, column.bottomProductId]
  );

  try {
    const rows = await prisma.product.findMany({
      where: {
        isPublished: true,
        OR: [{ isFeatured: true }, { id: { in: slotIds } }],
      },
      include: productInclude,
      orderBy: { id: "asc" },
    });
    return rows.map(mapDbProductToAppliance);
  } catch (error) {
    console.error("Failed to load featured products from database:", error);
    return [];
  }
}

/**
 * What a product page's related items and add-ons are chosen from, in one
 * query: published products in the subcategories relatedProducts() may draw
 * on, plus the configured add-ons. Up to a few dozen rows rather than the
 * whole catalogue the page used to load for this.
 *
 * A query that fails throws, like getPublishedProduct: the product page is
 * regenerated in the background, and a throw keeps the last good page, with
 * its related items, where an empty list would have quietly dropped them.
 */
export async function getRelatedCandidates(
  product: Pick<Appliance, "id" | "category" | "subcategory">
): Promise<Appliance[]> {
  const subcategories = relatedSubcategories(product.subcategory);
  const addOnIds = PRODUCT_ADD_ONS[product.subcategory]?.productIds ?? [];
  if (subcategories.length === 0 && addOnIds.length === 0) return [];

  if (!process.env.DATABASE_URL) {
    return [];
  }

  const prisma = getPrisma();
  if (!prisma) {
    return [];
  }

  try {
    const rows = await prisma.product.findMany({
      where: {
        isPublished: true,
        id: { not: product.id },
        OR: [
          {
            subcategory: {
              slug: { in: subcategories },
              category: { label: product.category },
            },
          },
          { id: { in: [...addOnIds] } },
        ],
      },
      include: productInclude,
      orderBy: { id: "asc" },
    });
    return rows.map(mapDbProductToAppliance);
  } catch (error) {
    throw new Error("Failed to load related products from database", { cause: error });
  }
}

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
      // Thrown, not an empty list: a sitemap without products would tell
      // crawlers they had all gone.
      throw new Error("Failed to load products for sitemap", { cause: error });
    }
  }
);

/**
 * Null means no published product has this id or slug, and the page 404s. A
 * query that fails throws instead, so an outage never tells a visitor - or a
 * crawler - that the product is gone; the last good page stays in place.
 */
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
      include: productDetailInclude,
    });
    return row ? mapDbProductToAppliance(row) : null;
  } catch (error) {
    throw new Error("Failed to load product from database", { cause: error });
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
      include: productDetailInclude,
    });
    return row ? mapDbProductToAppliance(row) : null;
  } catch (error) {
    throw new Error("Failed to load product from database", { cause: error });
  }
});
