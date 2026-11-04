import type {
  Brand,
  Product,
  ProductFaq,
  Subcategory,
  Category,
  StockStatus,
  OptionType,
  OptionValue,
} from "@prisma/client";
import type { Appliance, ProductOptionGroup } from "../data/products";
import { buildProductImageSet } from "./productImages";

export type ProductWithRelations = Product & {
  brand: Brand | null;
  subcategory: Subcategory & { category: Category };
  /** Present only for the single-product queries, which include them. */
  faqs?: ProductFaq[];
  /** The ticked option values; present only for the single-product queries. */
  optionValues?: { optionValue: OptionValue & { optionType: OptionType } }[];
  /** How many values are ticked; the list queries count them for the cards. */
  _count?: { optionValues: number };
};

/** The ticked values grouped by type, types and values in System data order. */
function groupOptions(
  rows: { optionValue: OptionValue & { optionType: OptionType } }[]
): ProductOptionGroup[] {
  const values = rows
    .map((row) => row.optionValue)
    .sort(
      (a, b) =>
        a.optionType.sortOrder - b.optionType.sortOrder ||
        a.optionType.id - b.optionType.id ||
        a.sortOrder - b.sortOrder ||
        a.id - b.id
    );
  const groups: ProductOptionGroup[] = [];
  for (const value of values) {
    let group = groups.find((g) => g.typeId === value.optionTypeId);
    if (!group) {
      group = { typeId: value.optionTypeId, name: value.optionType.name, values: [] };
      groups.push(group);
    }
    group.values.push({ id: value.id, value: value.value });
  }
  return groups;
}

export function stockStatusLabel(status: StockStatus): string {
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
    categorySlug: product.subcategory.category.slug,
    subcategory: product.subcategory.slug,
    subcategoryLabel: product.subcategory.label,
    price: product.priceKes,
    status: stockStatusLabel(product.stockStatus),
    brand: product.brand?.name ?? null,
    brandSlug: product.brand?.slug,
    specs: product.specs,
    description: product.description,
    body: product.body,
    faqs: product.faqs?.map((faq) => ({ question: faq.question, answer: faq.answer })),
    highlights: product.highlights as string[],
    metaTitle: product.metaTitle,
    metaDescription: product.metaDescription,
    isFeatured: product.isFeatured,
    ...((product._count?.optionValues ?? product.optionValues?.length ?? 0) > 0 && { hasOptions: true }),
    ...(product.optionValues && { options: groupOptions(product.optionValues) }),
    imageSet,
    image: imageSet.card,
    images: imageSet.gallery,
  };
}
