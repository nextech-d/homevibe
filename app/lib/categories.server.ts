import "server-only";

import { ALL_CATEGORIES, type Category } from "../data/categories";
import { getPrisma } from "./db";

/** Load categories from Postgres, with static fallback when DB is unavailable. */
export async function getAllCategories(): Promise<Category[]> {
  if (!process.env.DATABASE_URL) {
    return ALL_CATEGORIES;
  }

  const prisma = getPrisma();
  if (!prisma) {
    return ALL_CATEGORIES;
  }

  try {
    const rows = await prisma.category.findMany({
      include: { subcategories: { orderBy: { sortOrder: "asc" } } },
      orderBy: { sortOrder: "asc" },
    });

    if (rows.length === 0) {
      return ALL_CATEGORIES;
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
      })),
    }));
  } catch (error) {
    console.error("Failed to load categories from database:", error);
    return ALL_CATEGORIES;
  }
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
