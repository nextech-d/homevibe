import type { StockStatus } from "@prisma/client";
import { resolveSubcategoryIdForCategory } from "./catalog.js";
import { getPrisma } from "./db.js";
import { validateProductImageRefs } from "./uploads.js";

export type AdminProductListItem = {
  id: number;
  name: string;
  brand: string;
  priceKes: number;
  stockStatus: StockStatus;
  isPublished: boolean;
  isFeatured: boolean;
  primaryPhotoId: string;
};

export type AdminProductDetail = {
  id: number;
  slug: string;
  name: string;
  brandId: number;
  brandName: string;
  subcategoryId: number;
  subcategoryLabel: string;
  categoryLabel: string;
  priceKes: number;
  stockStatus: StockStatus;
  isPublished: boolean;
  isFeatured: boolean;
  specs: string;
  description: string;
  metaTitle: string | null;
  metaDescription: string | null;
  highlights: string[];
  primaryPhotoId: string;
  galleryPhotoIds: string[];
};

export type ProductFormInput = {
  name: string;
  slug?: string;
  brandId: number;
  subcategoryId: number;
  priceKes: number;
  stockStatus: StockStatus;
  isPublished: boolean;
  isFeatured?: boolean;
  specs: string;
  description: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
  highlights?: string[];
  primaryPhotoId: string;
  galleryPhotoIds: string[];
};

export type BrandOption = { id: number; name: string };
export type SubcategoryOption = {
  id: number;
  label: string;
  slug: string;
  categoryLabel: string;
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function uniqueSlug(base: string, excludeId?: number): Promise<string> {
  const prisma = getPrisma();
  if (!prisma) throw new Error("Database unavailable");

  let slug = base;
  let suffix = 0;
  while (true) {
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (!existing || existing.id === excludeId) return slug;
    suffix += 1;
    slug = `${base}-${suffix}`;
  }
}

function mapDetail(product: {
  id: number;
  slug: string;
  name: string;
  brandId: number;
  subcategoryId: number;
  priceKes: number;
  stockStatus: StockStatus;
  isPublished: boolean;
  isFeatured: boolean;
  specs: string;
  description: string;
  metaTitle: string | null;
  metaDescription: string | null;
  highlights: unknown;
  primaryPhotoId: string;
  galleryPhotoIds: unknown;
  brand: { name: string };
  subcategory: { label: string; categoryId: number; category: { label: string } };
}): AdminProductDetail {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    brandId: product.brandId,
    brandName: product.brand.name,
    subcategoryId: product.subcategoryId,
    subcategoryLabel: product.subcategory.label,
    categoryLabel: product.subcategory.category.label,
    priceKes: product.priceKes,
    stockStatus: product.stockStatus,
    isPublished: product.isPublished,
    isFeatured: product.isFeatured,
    specs: product.specs,
    description: product.description,
    metaTitle: product.metaTitle,
    metaDescription: product.metaDescription,
    highlights: Array.isArray(product.highlights) ? (product.highlights as string[]) : [],
    primaryPhotoId: product.primaryPhotoId,
    galleryPhotoIds: Array.isArray(product.galleryPhotoIds)
      ? (product.galleryPhotoIds as string[])
      : [],
  };
}

export async function listProductsForAdmin(): Promise<AdminProductListItem[]> {
  const result = await listProductsFiltered({});
  return result.products;
}

export type ProductListFilters = {
  q?: string;
  stockStatus?: StockStatus;
  published?: boolean;
  brandId?: number;
  subcategoryId?: number;
};

export type ProductListResult = {
  products: AdminProductListItem[];
  summary: {
    total: number;
    published: number;
    unpublished: number;
    lowStock: number;
    outOfStock: number;
  };
};

export async function listProductsFiltered(
  filters: ProductListFilters
): Promise<ProductListResult> {
  const prisma = getPrisma();
  if (!prisma) {
    return {
      products: [],
      summary: { total: 0, published: 0, unpublished: 0, lowStock: 0, outOfStock: 0 },
    };
  }

  const [total, published, unpublished, lowStock, outOfStock] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { isPublished: true } }),
    prisma.product.count({ where: { isPublished: false } }),
    prisma.product.count({ where: { stockStatus: "low_stock" } }),
    prisma.product.count({ where: { stockStatus: "out_of_stock" } }),
  ]);

  const q = filters.q?.trim();
  const idQuery = q && /^#?\d+$/.test(q) ? Number(q.replace(/^#/, "")) : null;
  const where = {
    ...(filters.stockStatus ? { stockStatus: filters.stockStatus } : {}),
    ...(filters.published !== undefined ? { isPublished: filters.published } : {}),
    ...(filters.brandId ? { brandId: filters.brandId } : {}),
    ...(filters.subcategoryId ? { subcategoryId: filters.subcategoryId } : {}),
    ...(q
      ? {
          OR: [
            ...(idQuery !== null ? [{ id: idQuery }] : []),
            { name: { contains: q, mode: "insensitive" as const } },
            { slug: { contains: q, mode: "insensitive" as const } },
            { brand: { name: { contains: q, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };

  const products = await prisma.product.findMany({
    where,
    include: { brand: true },
    orderBy: { id: "asc" },
  });

  return {
    products: products.map((product) => ({
      id: product.id,
      name: product.name,
      brand: product.brand.name,
      priceKes: product.priceKes,
      stockStatus: product.stockStatus,
      isPublished: product.isPublished,
      isFeatured: product.isFeatured,
      primaryPhotoId: product.primaryPhotoId,
    })),
    summary: { total, published, unpublished, lowStock, outOfStock },
  };
}

export async function getProductForAdmin(id: number): Promise<AdminProductDetail | null> {
  const prisma = getPrisma();
  if (!prisma) return null;

  const product = await prisma.product.findUnique({
    where: { id },
    include: { brand: true, subcategory: { include: { category: true } } },
  });

  return product ? mapDetail(product) : null;
}

export async function listBrandOptions(): Promise<BrandOption[]> {
  const prisma = getPrisma();
  if (!prisma) return [];
  return prisma.brand.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export async function listSubcategoryOptions(): Promise<SubcategoryOption[]> {
  const prisma = getPrisma();
  if (!prisma) return [];

  const categories = await prisma.category.findMany({
    include: { subcategories: { orderBy: [{ sortOrder: "asc" }, { id: "asc" }] } },
    orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
  });

  const options: SubcategoryOption[] = [];

  for (const category of categories) {
    if (category.subcategories.length === 0) {
      const subcategoryId = await resolveSubcategoryIdForCategory(category.id);
      const sub = await prisma.subcategory.findUnique({
        where: { id: subcategoryId },
        include: { category: true },
      });
      if (sub) {
        options.push({
          id: sub.id,
          label: sub.label,
          slug: sub.slug,
          categoryLabel: sub.category.label,
        });
      }
      continue;
    }

    for (const sub of category.subcategories) {
      options.push({
        id: sub.id,
        label: sub.label,
        slug: sub.slug,
        categoryLabel: category.label,
      });
    }
  }

  return options;
}

export async function createProductForAdmin(input: ProductFormInput): Promise<AdminProductDetail> {
  const prisma = getPrisma();
  if (!prisma) throw new Error("Database unavailable");

  const baseSlug = slugify(input.slug?.trim() || input.name);
  const slug = await uniqueSlug(baseSlug);

  const product = await prisma.product.create({
    data: {
      slug,
      name: input.name.trim(),
      brandId: input.brandId,
      subcategoryId: input.subcategoryId,
      priceKes: Math.round(input.priceKes),
      stockStatus: input.stockStatus,
      isPublished: input.isPublished,
      isFeatured: input.isFeatured ?? false,
      specs: input.specs.trim(),
      description: input.description.trim(),
      metaTitle: input.metaTitle?.trim() || null,
      metaDescription: input.metaDescription?.trim() || null,
      highlights: input.highlights ?? [],
      primaryPhotoId: input.primaryPhotoId.trim(),
      galleryPhotoIds: input.galleryPhotoIds,
    },
    include: { brand: true, subcategory: { include: { category: true } } },
  });

  return mapDetail(product);
}

export async function updateProductForAdmin(
  id: number,
  input: Partial<ProductFormInput>
): Promise<AdminProductDetail | null> {
  const prisma = getPrisma();
  if (!prisma) return null;

  const data: Record<string, unknown> = {};
  if (input.name !== undefined) data.name = input.name.trim();
  if (input.slug !== undefined) data.slug = await uniqueSlug(slugify(input.slug), id);
  if (input.brandId !== undefined) data.brandId = input.brandId;
  if (input.subcategoryId !== undefined) data.subcategoryId = input.subcategoryId;
  if (input.priceKes !== undefined) data.priceKes = Math.round(input.priceKes);
  if (input.stockStatus !== undefined) data.stockStatus = input.stockStatus;
  if (input.isPublished !== undefined) data.isPublished = input.isPublished;
  if (input.isFeatured !== undefined) data.isFeatured = input.isFeatured;
  if (input.specs !== undefined) data.specs = input.specs.trim();
  if (input.description !== undefined) data.description = input.description.trim();
  if (input.metaTitle !== undefined) data.metaTitle = input.metaTitle?.trim() || null;
  if (input.metaDescription !== undefined) data.metaDescription = input.metaDescription?.trim() || null;
  if (input.highlights !== undefined) data.highlights = input.highlights;
  if (input.primaryPhotoId !== undefined) data.primaryPhotoId = input.primaryPhotoId.trim();
  if (input.galleryPhotoIds !== undefined) data.galleryPhotoIds = input.galleryPhotoIds;

  if (Object.keys(data).length === 0) return getProductForAdmin(id);

  try {
    const product = await prisma.product.update({
      where: { id },
      data,
      include: { brand: true, subcategory: { include: { category: true } } },
    });
    return mapDetail(product);
  } catch {
    return null;
  }
}

/** Quick list-page update (price, stock, publish). */
export async function patchProductPriceStock(
  id: number,
  data: { priceKes?: number; stockStatus?: StockStatus; isPublished?: boolean }
): Promise<AdminProductListItem | null> {
  const prisma = getPrisma();
  if (!prisma) return null;

  const updateData: {
    priceKes?: number;
    stockStatus?: StockStatus;
    isPublished?: boolean;
  } = {};
  if (typeof data.priceKes === "number" && data.priceKes >= 0) {
    updateData.priceKes = Math.round(data.priceKes);
  }
  if (data.stockStatus) updateData.stockStatus = data.stockStatus;
  if (typeof data.isPublished === "boolean") {
    if (data.isPublished) {
      const existing = await prisma.product.findUnique({ where: { id } });
      if (!existing) return null;
      const galleryIds = Array.isArray(existing.galleryPhotoIds)
        ? (existing.galleryPhotoIds as string[])
        : [];
      const imageError = validateProductImageRefs(existing.primaryPhotoId, galleryIds, {
        requirePrimary: true,
      });
      if (imageError) throw new Error(imageError);
    }
    updateData.isPublished = data.isPublished;
  }
  if (Object.keys(updateData).length === 0) return null;

  try {
    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      include: { brand: true },
    });
    return {
      id: product.id,
      name: product.name,
      brand: product.brand.name,
      priceKes: product.priceKes,
      stockStatus: product.stockStatus,
      isPublished: product.isPublished,
      isFeatured: product.isFeatured,
      primaryPhotoId: product.primaryPhotoId,
    };
  } catch {
    return null;
  }
}
