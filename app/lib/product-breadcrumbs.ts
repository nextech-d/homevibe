import { categoryHref, getCategorySlug, getSubcategoryLabel } from "../data/categories";
import type { Appliance } from "../data/products";

export type ProductCrumb = { label: string; href?: string };

/**
 * The product page's trail - Home > category > subcategory > product - from
 * the product's own category and subcategory rows: their slugs for the links,
 * their labels for the names. Both the visible breadcrumb and its
 * BreadcrumbList JSON-LD are built from this, so the two can't drift apart.
 *
 * The static category list is only a fallback for a product read without its
 * database rows; it knows a handful of subcategories, and used to turn every
 * other one into its raw slug ("adhesives-and-sealants").
 *
 * The subcategory crumb is left out when its slug is the category's own, as
 * before.
 */
export function productBreadcrumbs(
  product: Pick<Appliance, "name" | "category" | "categorySlug" | "subcategory" | "subcategoryLabel">
): ProductCrumb[] {
  const categorySlug = product.categorySlug ?? getCategorySlug(product.category);
  const crumbs: ProductCrumb[] = [
    { label: "Home", href: "/" },
    { label: product.category, href: categoryHref(categorySlug) },
  ];
  if (product.subcategory.toLowerCase() !== categorySlug.toLowerCase()) {
    crumbs.push({
      label: product.subcategoryLabel ?? getSubcategoryLabel(categorySlug, product.subcategory),
      href: categoryHref(categorySlug, product.subcategory),
    });
  }
  crumbs.push({ label: product.name });
  return crumbs;
}
