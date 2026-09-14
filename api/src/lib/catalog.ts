import type { BrandTier } from "@prisma/client";
import { getPrisma } from "./db.js";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function searchTerms(q?: string): string[] {
  return q?.trim().toLowerCase().split(/\s+/).filter(Boolean) ?? [];
}

function textMatchesTerms(text: string, terms: string[]): boolean {
  if (terms.length === 0) return true;
  const haystack = text.toLowerCase();
  return terms.every((term) => haystack.includes(term));
}

export type BrandListItem = {
  id: number;
  name: string;
  slug: string;
  tier: BrandTier;
  origin: string;
  logoUrl: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  sortOrder: number;
  isFeatured: boolean;
  productCount: number;
};

export type BrandListSummary = {
  total: number;
  filtered: number;
  signature: number;
  partner: number;
};

export async function listBrands() {
  const prisma = getPrisma();
  if (!prisma) return [];
  return prisma.brand.findMany({ orderBy: { sortOrder: "asc" } });
}

export async function listBrandsFiltered(filters: { q?: string; tier?: BrandTier }) {
  const prisma = getPrisma();
  if (!prisma) {
    return {
      brands: [] as BrandListItem[],
      summary: { total: 0, filtered: 0, signature: 0, partner: 0 },
    };
  }

  const q = filters.q?.trim().toLowerCase();
  const tier = filters.tier;

  const where = {
    ...(tier ? { tier } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { slug: { contains: q, mode: "insensitive" as const } },
            { origin: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [brands, total, signature, partner] = await Promise.all([
    prisma.brand.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: { _count: { select: { products: true } } },
    }),
    prisma.brand.count(),
    prisma.brand.count({ where: { tier: "signature" } }),
    prisma.brand.count({ where: { tier: "partner" } }),
  ]);

  return {
    brands: brands.map((b) => ({
      id: b.id,
      name: b.name,
      slug: b.slug,
      tier: b.tier,
      origin: b.origin,
      logoUrl: b.logoUrl,
      metaTitle: b.metaTitle,
      metaDescription: b.metaDescription,
      sortOrder: b.sortOrder,
      isFeatured: b.isFeatured,
      productCount: b._count.products,
    })),
    summary: {
      total,
      filtered: brands.length,
      signature,
      partner,
    } satisfies BrandListSummary,
  };
}

export async function getBrandById(id: number) {
  const prisma = getPrisma();
  if (!prisma) return null;
  const brand = await prisma.brand.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } },
  });
  if (!brand) return null;
  return {
    id: brand.id,
    name: brand.name,
    slug: brand.slug,
    tier: brand.tier,
    origin: brand.origin,
    logoUrl: brand.logoUrl,
    metaTitle: brand.metaTitle,
    metaDescription: brand.metaDescription,
    sortOrder: brand.sortOrder,
    isFeatured: brand.isFeatured,
    productCount: brand._count.products,
  };
}

export async function createBrand(input: {
  name: string;
  slug?: string;
  tier?: BrandTier;
  origin: string;
  logoUrl?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  sortOrder?: number;
  isFeatured?: boolean;
}) {
  const prisma = getPrisma();
  if (!prisma) throw new Error("Database unavailable");
  return prisma.brand.create({
    data: {
      name: input.name.trim(),
      slug: slugify(input.slug || input.name),
      tier: input.tier ?? "partner",
      origin: input.origin.trim(),
      logoUrl: input.logoUrl?.trim() || null,
      metaTitle: input.metaTitle?.trim() || null,
      metaDescription: input.metaDescription?.trim() || null,
      sortOrder: input.sortOrder ?? 0,
      isFeatured: input.isFeatured ?? false,
    },
  });
}

export async function updateBrand(
  id: number,
  input: Partial<{
    name: string;
    slug: string;
    tier: BrandTier;
    origin: string;
    logoUrl: string | null;
    metaTitle: string | null;
    metaDescription: string | null;
    sortOrder: number;
    isFeatured: boolean;
  }>
) {
  const prisma = getPrisma();
  if (!prisma) return null;

  const data: typeof input = { ...input };
  if (typeof data.name === "string") data.name = data.name.trim();
  if (typeof data.origin === "string") data.origin = data.origin.trim();
  if (typeof data.slug === "string") data.slug = slugify(data.slug);
  if (data.logoUrl !== undefined) data.logoUrl = data.logoUrl?.trim() || null;
  if (data.metaTitle !== undefined) data.metaTitle = data.metaTitle?.trim() || null;
  if (data.metaDescription !== undefined) {
    data.metaDescription = data.metaDescription?.trim() || null;
  }

  try {
    return await prisma.brand.update({ where: { id }, data });
  } catch {
    return null;
  }
}

export async function deleteBrand(id: number): Promise<{ ok: true } | { ok: false; message: string }> {
  const prisma = getPrisma();
  if (!prisma) return { ok: false, message: "Database unavailable." };

  const productCount = await prisma.product.count({ where: { brandId: id } });
  if (productCount > 0) {
    return {
      ok: false,
      message: `Cannot delete: ${productCount} product${productCount === 1 ? "" : "s"} still use this brand. Reassign them first.`,
    };
  }

  try {
    await prisma.brand.delete({ where: { id } });
    return { ok: true };
  } catch {
    return { ok: false, message: "Cannot delete brand." };
  }
}

export async function getCategoryById(id: number) {
  const prisma = getPrisma();
  if (!prisma) return null;
  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      subcategories: {
        orderBy: { sortOrder: "asc" },
        include: { _count: { select: { products: true } } },
      },
      _count: { select: { subcategories: true } },
    },
  });
  if (!category) return null;

  const subcategories = category.subcategories.map((sub) => ({
    id: sub.id,
    label: sub.label,
    slug: sub.slug,
    categoryId: sub.categoryId,
    sortOrder: sub.sortOrder,
    productCount: sub._count.products,
  }));

  const productCount = subcategories.reduce((sum, sub) => sum + sub.productCount, 0);

  return {
    id: category.id,
    label: category.label,
    slug: category.slug,
    navLabel: category.navLabel,
    description: category.description,
    sortOrder: category.sortOrder,
    subcategoryCount: category._count.subcategories,
    productCount,
    subcategories,
  };
}

export async function getSubcategoryById(id: number) {
  const prisma = getPrisma();
  if (!prisma) return null;
  const subcategory = await prisma.subcategory.findUnique({
    where: { id },
    include: {
      category: { select: { id: true, label: true } },
      _count: { select: { products: true } },
    },
  });
  if (!subcategory) return null;
  return {
    id: subcategory.id,
    categoryId: subcategory.categoryId,
    categoryLabel: subcategory.category.label,
    label: subcategory.label,
    slug: subcategory.slug,
    sortOrder: subcategory.sortOrder,
    productCount: subcategory._count.products,
  };
}

export type CategoryListSubcategory = {
  id: number;
  label: string;
  slug: string;
  categoryId: number;
  sortOrder: number;
  productCount: number;
};

export type CategoryListItem = {
  id: number;
  label: string;
  slug: string;
  navLabel: string;
  description: string;
  sortOrder: number;
  subcategoryCount: number;
  productCount: number;
  subcategories: CategoryListSubcategory[];
};

export type CategoryListSummary = {
  totalCategories: number;
  totalSubcategories: number;
  filteredCategories: number;
};

export type StorefrontCategory = {
  label: string;
  slug: string;
  navLabel: string;
  description: string;
  subcategories: { label: string; slug: string }[];
};

export async function listCategoriesForStorefront(): Promise<StorefrontCategory[]> {
  const prisma = getPrisma();
  if (!prisma) return [];

  const rows = await prisma.category.findMany({
    include: { subcategories: { orderBy: { sortOrder: "asc" } } },
    orderBy: { sortOrder: "asc" },
  });

  return rows.map((category) => ({
    label: category.label,
    slug: category.slug,
    navLabel: category.navLabel,
    description: category.description,
    subcategories: category.subcategories.map((sub) => ({
      label: sub.label,
      slug: sub.slug,
    })),
  }));
}

export async function listCategories() {
  const prisma = getPrisma();
  if (!prisma) return [];
  return prisma.category.findMany({
    include: { subcategories: { orderBy: { sortOrder: "asc" } } },
    orderBy: { sortOrder: "asc" },
  });
}

export async function listCategoriesFiltered(filters: { q?: string }) {
  const prisma = getPrisma();
  if (!prisma) {
    return {
      categories: [] as CategoryListItem[],
      summary: { totalCategories: 0, totalSubcategories: 0, filteredCategories: 0 },
    };
  }

  const terms = searchTerms(filters.q);

  const [allCategories, totalCategories, totalSubcategories] = await Promise.all([
    prisma.category.findMany({
      include: {
        subcategories: {
          orderBy: { sortOrder: "asc" },
          include: { _count: { select: { products: true } } },
        },
      },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.category.count(),
    prisma.subcategory.count(),
  ]);

  const categories = allCategories
    .map((category) => {
      const subcategories = category.subcategories.map((sub) => ({
        id: sub.id,
        label: sub.label,
        slug: sub.slug,
        categoryId: sub.categoryId,
        sortOrder: sub.sortOrder,
        productCount: sub._count.products,
      }));

      const productCount = subcategories.reduce((sum, sub) => sum + sub.productCount, 0);

      return {
        id: category.id,
        label: category.label,
        slug: category.slug,
        navLabel: category.navLabel,
        description: category.description,
        sortOrder: category.sortOrder,
        subcategoryCount: subcategories.length,
        productCount,
        subcategories,
      };
    })
    .map((category) => {
      if (terms.length === 0) return category;

      const categoryText = [
        category.label,
        category.slug,
        category.navLabel,
        category.description,
      ].join(" ");
      const categoryMatches = textMatchesTerms(categoryText, terms);

      const matchingSubs = category.subcategories.filter((sub) =>
        textMatchesTerms(`${sub.label} ${sub.slug}`, terms)
      );

      if (!categoryMatches && matchingSubs.length === 0) return null;

      const visibleSubs = categoryMatches ? category.subcategories : matchingSubs;

      return {
        ...category,
        subcategories: visibleSubs,
        subcategoryCount: visibleSubs.length,
      };
    })
    .filter((category): category is CategoryListItem => category !== null);

  return {
    categories,
    summary: {
      totalCategories,
      totalSubcategories,
      filteredCategories: categories.length,
    } satisfies CategoryListSummary,
  };
}

export async function createCategory(input: {
  label: string;
  slug?: string;
  navLabel: string;
  description: string;
  sortOrder?: number;
}) {
  const prisma = getPrisma();
  if (!prisma) throw new Error("Database unavailable");
  return prisma.category.create({
    data: {
      label: input.label.trim(),
      slug: slugify(input.slug || input.label),
      navLabel: input.navLabel.trim(),
      description: input.description.trim(),
      sortOrder: input.sortOrder ?? 0,
    },
  });
}

export async function updateCategory(
  id: number,
  input: Partial<{
    label: string;
    slug: string;
    navLabel: string;
    description: string;
    sortOrder: number;
  }>
) {
  const prisma = getPrisma();
  if (!prisma) return null;
  const data: typeof input = { ...input };
  if (typeof data.label === "string") data.label = data.label.trim();
  if (typeof data.navLabel === "string") data.navLabel = data.navLabel.trim();
  if (typeof data.description === "string") data.description = data.description.trim();
  if (typeof data.slug === "string") data.slug = slugify(data.slug);

  try {
    return await prisma.category.update({ where: { id }, data });
  } catch {
    return null;
  }
}

export async function deleteCategory(
  id: number
): Promise<{ ok: true } | { ok: false; message: string }> {
  const prisma = getPrisma();
  if (!prisma) return { ok: false, message: "Database unavailable." };

  const productCount = await prisma.product.count({
    where: { subcategory: { categoryId: id } },
  });
  if (productCount > 0) {
    return {
      ok: false,
      message: `Cannot delete: ${productCount} product${productCount === 1 ? "" : "s"} still use subcategories in this category. Reassign them first.`,
    };
  }

  try {
    await prisma.category.delete({ where: { id } });
    return { ok: true };
  } catch {
    return { ok: false, message: "Cannot delete category." };
  }
}

export type CategoryOption = {
  id: number;
  label: string;
  slug: string;
};

export async function listCategoryOptionsForProducts(): Promise<CategoryOption[]> {
  const prisma = getPrisma();
  if (!prisma) return [];
  return prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
    select: { id: true, label: true, slug: true },
  });
}

/** Flat categories (e.g. TVs) get a hidden bucket subcategory for product assignment. */
export async function resolveSubcategoryIdForCategory(categoryId: number): Promise<number> {
  const prisma = getPrisma();
  if (!prisma) throw new Error("Database unavailable");

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: { subcategories: { orderBy: [{ sortOrder: "asc" }, { id: "asc" }] } },
  });
  if (!category) throw new Error("Category not found");

  const bucket = category.subcategories.find((sub) => sub.slug === category.slug);
  if (bucket) return bucket.id;

  const created = await prisma.subcategory.create({
    data: {
      categoryId,
      label: category.label,
      slug: category.slug,
      sortOrder: 0,
    },
  });
  return created.id;
}

export async function listSubcategories() {
  const prisma = getPrisma();
  if (!prisma) return [];
  return prisma.subcategory.findMany({
    include: { category: true },
    orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }],
  });
}

export async function createSubcategory(input: {
  categoryId: number;
  label: string;
  slug?: string;
  sortOrder?: number;
}) {
  const prisma = getPrisma();
  if (!prisma) throw new Error("Database unavailable");
  return prisma.subcategory.create({
    data: {
      categoryId: input.categoryId,
      label: input.label.trim(),
      slug: slugify(input.slug || input.label),
      sortOrder: input.sortOrder ?? 0,
    },
  });
}

export async function updateSubcategory(
  id: number,
  input: Partial<{ categoryId: number; label: string; slug: string; sortOrder: number }>
) {
  const prisma = getPrisma();
  if (!prisma) return null;

  const data: typeof input = { ...input };
  if (typeof data.label === "string") data.label = data.label.trim();
  if (typeof data.slug === "string") data.slug = slugify(data.slug);

  try {
    return await prisma.subcategory.update({ where: { id }, data });
  } catch {
    return null;
  }
}

export async function deleteSubcategory(
  id: number
): Promise<{ ok: true } | { ok: false; message: string }> {
  const prisma = getPrisma();
  if (!prisma) return { ok: false, message: "Database unavailable." };

  const productCount = await prisma.product.count({ where: { subcategoryId: id } });
  if (productCount > 0) {
    return {
      ok: false,
      message: `Cannot delete: ${productCount} product${productCount === 1 ? "" : "s"} still use this subcategory. Reassign them first.`,
    };
  }

  try {
    await prisma.subcategory.delete({ where: { id } });
    return { ok: true };
  } catch {
    return { ok: false, message: "Cannot delete subcategory." };
  }
}

export async function getAdminStats() {
  const prisma = getPrisma();
  if (!prisma) {
    return { products: 0, orders: 0, pendingPayments: 0, brands: 0 };
  }

  const [products, orders, pendingPayments, brands] = await Promise.all([
    prisma.product.count(),
    prisma.order.count(),
    prisma.order.count({ where: { paymentStatus: "pending" } }),
    prisma.brand.count(),
  ]);

  return { products, orders, pendingPayments, brands };
}
