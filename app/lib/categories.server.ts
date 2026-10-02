import "server-only";

import { cache } from "react";

import { ALL_CATEGORIES, type Category } from "../data/categories";
import { getPrisma } from "./db";

/**
 * Categories straight from Postgres, or null when the database is unavailable.
 * Callers that render UI want {@link getAllCategories}; the null is for the
 * root layout, which hands the nav its data and needs to know whether the
 * client should still fetch for itself.
 *
 * Memoised per request, so the layout, footer, category page and sitemap share
 * one query rather than running the same findMany three or four times.
 */
export const getCategoriesFromDb = cache(async (): Promise<Category[] | null> => {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  const prisma = getPrisma();
  if (!prisma) {
    return null;
  }

  try {
    const rows = await prisma.category.findMany({
      // id breaks the tie: sort_order defaults to 0, so without it any two
      // categories left at the default come back in whatever order Postgres
      // feels like, and the nav row reshuffles for no visible reason.
      include: {
        subcategories: {
          // Counted here so the nav can drop subcategories with nothing in them,
          // without a second query per category.
          include: { _count: { select: { products: { where: { isPublished: true } } } } },
          orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
        },
      },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    });

    if (rows.length === 0) {
      return null;
    }

    return rows.map((category) => ({
      label: category.label,
      slug: category.slug,
      navLabel: category.navLabel,
      description: category.description,
      metaTitle: category.metaTitle,
      metaDescription: category.metaDescription,
      subcategories: category.subcategories.map((sub) => ({
        label: sub.label,
        slug: sub.slug,
        metaTitle: sub.metaTitle,
        metaDescription: sub.metaDescription,
        productCount: sub._count.products,
      })),
    }));
  } catch (error) {
    console.error("Failed to load categories from database:", error);
    return null;
  }
});

/** Load categories from Postgres, with static fallback when DB is unavailable. */
export async function getAllCategories(): Promise<Category[]> {
  return (await getCategoriesFromDb()) ?? ALL_CATEGORIES;
}

export async function getNavCategories(): Promise<Category[]> {
  return getAllCategories();
}

export async function getCategoryBySlugFromDb(
  slug: string | string[] | undefined
): Promise<Category | undefined> {
  const normalized = Array.isArray(slug) ? slug[0] : slug;
  if (!normalized) return undefined;
  const categories = await getAllCategories();
  return categories.find((c) => c.slug === normalized.toLowerCase());
}
