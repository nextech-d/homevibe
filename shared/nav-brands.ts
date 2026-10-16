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
 * A brand with a single product isn't listed, unless it's marked featured in
 * the admin: that's the deliberate way to keep a brand on show however much
 * of it is in stock. The rest were one-off items entered under a product type
 * or an unknown maker ("Shock Pad", "Pressure Machine"), not brands anyone
 * shops by. The brand and its page stay; the product is still reachable from
 * its category and search.
 */
export const NAV_BRAND_MIN_PRODUCTS = 2;

export function navBrands<
  T extends { name: string; isFeatured: boolean; _count: { products: number } },
>(rows: T[]): T[] {
  return rows
    .filter((brand) => brand.isFeatured || brand._count.products >= NAV_BRAND_MIN_PRODUCTS)
    .sort((a, b) => b._count.products - a._count.products || a.name.localeCompare(b.name));
}
