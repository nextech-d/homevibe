/**
 * Which brands the storefront lists - the nav dropdown and the homepage's
 * "Brands we stock" - and in what order. Shared by the API and the storefront
 * so every path that fills those lists agrees; no imports, like everything in
 * shared/.
 *
 * Busiest first: a brand's place follows how many published products it has,
 * so Hisense leads and the list stays right as stock changes, with no sort
 * order to keep up by hand. Name breaks a tie.
 *
 * Every brand with a published product is listed. One with none isn't,
 * unless it's marked featured in the admin: that's the deliberate way to keep
 * a brand on show while it's out of stock. Its page stays either way.
 */
export const NAV_BRAND_MIN_PRODUCTS = 1;

export function navBrands<
  T extends { name: string; isFeatured: boolean; _count: { products: number } },
>(rows: T[]): T[] {
  return rows
    .filter((brand) => brand.isFeatured || brand._count.products >= NAV_BRAND_MIN_PRODUCTS)
    .sort((a, b) => b._count.products - a._count.products || a.name.localeCompare(b.name));
}
