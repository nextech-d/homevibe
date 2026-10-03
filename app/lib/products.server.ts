import "server-only";

import type { StockStatus } from "@prisma/client";
import { getPrisma } from "./db";

export type AdminProductListItem = {
  id: number;
  name: string;
  brand: string;
  priceKes: number;
  stockStatus: StockStatus;
  isPublished: boolean;
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
  specs: string;
  description: string;
  highlights: string[];
  /** ISO date someone confirmed this copy's promises, or null if nobody has. */
  claimsCheckedAt: string | null;
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
  specs: string;
  description: string;
  highlights: string[];
  /** The admin's "promises checked" tick; stamps claimsCheckedAt. */
  claimsChecked?: boolean;
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
  specs: string;
  description: string;
  highlights: unknown;
  claimsCheckedAt: Date | null;
  primaryPhotoId: string;
  galleryPhotoIds: unknown;
  brand: { name: string };
  subcategory: { label: string; category: { label: string } };
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
    specs: product.specs,
    description: product.description,
    highlights: Array.isArray(product.highlights) ? (product.highlights as string[]) : [],
    claimsCheckedAt: product.claimsCheckedAt ? product.claimsCheckedAt.toISOString() : null,
    primaryPhotoId: product.primaryPhotoId,
    galleryPhotoIds: Array.isArray(product.galleryPhotoIds)
      ? (product.galleryPhotoIds as string[])
      : [],
  };
}

export async function listProductsForAdmin(): Promise<AdminProductListItem[]> {
  const prisma = getPrisma();
  if (!prisma) return [];

  try {
    const products = await prisma.product.findMany({
      include: { brand: true },
      orderBy: { id: "asc" },
    });

    return products.map((product) => ({
      id: product.id,
      name: product.name,
      brand: product.brand.name,
      priceKes: product.priceKes,
      stockStatus: product.stockStatus,
      isPublished: product.isPublished,
    }));
  } catch (error) {
    console.error("Failed to load admin products from database:", error);
    return [];
  }
}

export async function getProductForAdmin(id: number): Promise<AdminProductDetail | null> {
  const prisma = getPrisma();
  if (!prisma) return null;

  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: { brand: true, subcategory: { include: { category: true } } },
    });

    return product ? mapDetail(product) : null;
  } catch (error) {
    console.error("Failed to load product from database:", error);
    return null;
  }
}

export async function listBrandOptions(): Promise<BrandOption[]> {
  const prisma = getPrisma();
  if (!prisma) return [];

  try {
    return await prisma.brand.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  } catch (error) {
    console.error("Failed to load brand options from database:", error);
    return [];
  }
}

export async function listSubcategoryOptions(): Promise<SubcategoryOption[]> {
  const prisma = getPrisma();
  if (!prisma) return [];

  try {
    const rows = await prisma.subcategory.findMany({
      include: { category: true },
      orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }],
    });
    return rows.map((row) => ({
      id: row.id,
      label: row.label,
      slug: row.slug,
      categoryLabel: row.category.label,
    }));
  } catch (error) {
    console.error("Failed to load subcategory options from database:", error);
    return [];
  }
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
      specs: input.specs.trim(),
      description: input.description.trim(),
      highlights: input.highlights,
      claimsCheckedAt: input.claimsChecked ? new Date() : null,
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
  if (input.specs !== undefined) data.specs = input.specs.trim();
  if (input.description !== undefined) data.description = input.description.trim();
  if (input.highlights !== undefined) data.highlights = input.highlights;
  if (input.claimsChecked !== undefined) {
    if (input.claimsChecked) {
      // Keeps the original date: the column records when the promise was
      // checked, not when the product was last saved.
      const existing = await prisma.product.findUnique({
        where: { id },
        select: { claimsCheckedAt: true },
      });
      data.claimsCheckedAt = existing?.claimsCheckedAt ?? new Date();
    } else {
      data.claimsCheckedAt = null;
    }
  }
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

/** Quick price/stock update from the products list page. */
export async function patchProductPriceStock(
  id: number,
  data: { priceKes?: number; stockStatus?: StockStatus }
): Promise<AdminProductListItem | null> {
  const prisma = getPrisma();
  if (!prisma) return null;

  const updateData: { priceKes?: number; stockStatus?: StockStatus } = {};
  if (typeof data.priceKes === "number" && data.priceKes >= 0) {
    updateData.priceKes = Math.round(data.priceKes);
  }
  if (data.stockStatus) updateData.stockStatus = data.stockStatus;
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
    };
  } catch {
    return null;
  }
}
