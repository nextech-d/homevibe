export type Brand = {
  name: string;
  slug: string;
  tier: "signature" | "partner";
  origin: string;
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

export const SIGNATURE_BRANDS = FEATURED_BRANDS.filter((b) => b.tier === "signature");
export const PARTNER_BRANDS = FEATURED_BRANDS.filter((b) => b.tier === "partner");
