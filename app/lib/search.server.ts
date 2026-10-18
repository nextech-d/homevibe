import "server-only";

import { unstable_cache } from "next/cache";
import { getInventory } from "./inventory.server";
import { toCatalogProduct, type CatalogProduct } from "./inventory";
import type { Searchable } from "./searchProducts";

/** Bumped with the rest of the storefront by revalidateStorefront. */
export const CATALOGUE_TAG = "catalogue";

/** A catalogue card plus the fields search matches and the popover shows. */
export type SearchEntry = CatalogProduct & Searchable;

/**
 * Every published product, cut down to what search needs, cached across
 * requests for 60 seconds or until an admin save bumps CATALOGUE_TAG. The
 * search endpoint answers each keystroke from this instead of the database, and
 * the browser no longer downloads the whole catalogue to search it. A failed
 * query throws and isn't cached, so the next request tries again.
 */
export const getSearchIndex = unstable_cache(
  async (): Promise<SearchEntry[]> =>
    (await getInventory()).map((product) => ({
      ...toCatalogProduct(product),
      brand: product.brand,
      category: product.category,
      subcategory: product.subcategory,
    })),
  ["search-index"],
  { revalidate: 60, tags: [CATALOGUE_TAG] }
);
