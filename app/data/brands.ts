export type Brand = {
  name: string;
  slug: string;
  tier: "signature" | "partner";
  origin: string;
  /** Admin flag; absent on the static fallback brands, which show as chips. */
  isFeatured?: boolean;
};

/** Fallback when the catalog API is unavailable — keep in sync with live DB brands. */
export const FEATURED_BRANDS: Brand[] = [
  { name: "Samsung", slug: "samsung", tier: "partner", origin: "Korea" },
  { name: "Hisense", slug: "hisense", tier: "partner", origin: "China" },
];

export function getBrandBySlug(slug: string): Brand | undefined {
  return FEATURED_BRANDS.find((b) => b.slug === slug);
}

export function brandHref(slug: string): string {
  return `/brand/${slug}`;
}

export function getProductsByBrandSlug(
  slug: string,
  products: { brand: string }[]
): { brand: string }[] {
  const brand = getBrandBySlug(slug);
  if (!brand) return [];
  return products.filter(
    (p) => p.brand.toLowerCase() === brand.name.toLowerCase()
  );
}
