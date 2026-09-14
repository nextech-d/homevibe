export {
  resolveProductImageUrl,
  productThumbUrl,
  PRODUCT_IMAGE_RECOMMENDED,
  PRODUCT_IMAGE_ACCEPT,
  PRODUCT_IMAGE_MAX_BYTES,
  validateImageFile,
  formatFileSize,
} from "./productImages";

export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

export const STOCK_LABELS: Record<StockStatus, string> = {
  in_stock: "In stock",
  low_stock: "Low stock",
  out_of_stock: "Out of stock",
};

export type BrandOption = { id: number; name: string };
export type SubcategoryOption = {
  id: number;
  label: string;
  slug: string;
  categoryLabel: string;
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
