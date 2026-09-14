import type { Brand, Product, Subcategory, Category, StockStatus } from "@prisma/client";
import type { Appliance } from "../types.js";
import { buildProductImageSet } from "./productImages.js";

export type ProductWithRelations = Product & {
  brand: Brand;
  subcategory: Subcategory & { category: Category };
};

function stockStatusLabel(status: StockStatus): string {
  switch (status) {
    case "in_stock":
      return "In Stock";
    case "low_stock":
      return "Low Stock";
    case "out_of_stock":
      return "Out of Stock";
    default:
      return "In Stock";
  }
}

export function mapDbProductToAppliance(product: ProductWithRelations): Appliance {
  const galleryPhotoIds = Array.isArray(product.galleryPhotoIds)
    ? (product.galleryPhotoIds as string[])
    : [];

  const imageSet = buildProductImageSet(product.primaryPhotoId, galleryPhotoIds);

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    category: product.subcategory.category.label,
    subcategory: product.subcategory.slug,
    price: product.priceKes,
    status: stockStatusLabel(product.stockStatus),
    brand: product.brand.name,
    specs: product.specs,
    description: product.description,
    highlights: product.highlights as string[],
    isFeatured: product.isFeatured,
    imageSet,
    image: imageSet.card,
    images: imageSet.gallery,
  };
}
