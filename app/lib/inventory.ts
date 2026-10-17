import { type Appliance } from "../data/products";
import type { ProductImageSet } from "./productImages";
import { apiUrl } from "./api-client";
import {
  PRODUCT_ADD_ONS,
  RELATED_FAMILIES,
  RELATED_HIDDEN_SUBCATEGORIES,
} from "../config/site";

export type { Appliance };

/**
 * What a catalog card and its add-to-cart button actually read. Grids are handed
 * this rather than whole products: a 53-item brand page would otherwise ship
 * every description, spec sheet and gallery URL it never renders, twice - once
 * in the HTML and again in the flight payload.
 */
export type CatalogProduct = Pick<
  Appliance,
  /** `status` is here for the card's WhatsApp enquiry, which asks about a
      product differently when it is out of stock. */
  "id" | "slug" | "name" | "price" | "status"
> & {
  image: string;
  imageSet: Pick<ProductImageSet, "thumbnail" | "card">;
  /** Drives the homepage grid's choice of layout. */
  isFeatured?: boolean;
};

/** One full row of cards on desktop, two on a phone. */
export const RELATED_LIMIT = 4;

type RelatedTarget = Pick<Appliance, "id" | "category" | "subcategory" | "price" | "brand">;

/**
 * The subcategories a product's related items may come from: its own first,
 * then the rest of its family. Empty for a catch-all with no related items.
 */
export function relatedSubcategories(subcategory: string): string[] {
  if (RELATED_HIDDEN_SUBCATEGORIES.includes(subcategory)) return [];
  const family = RELATED_FAMILIES.find((members) => members.includes(subcategory));
  return family ? [subcategory, ...family.filter((slug) => slug !== subcategory)] : [subcategory];
}

/**
 * The product page's related items, from candidates already limited to
 * published products: the same subcategory first, then its family, never
 * anything else - fewer cards, or none, rather than unrelated ones. Within
 * each, in stock before out of stock, then closest in price, then same brand.
 */
export function relatedProducts(candidates: Appliance[], product: RelatedTarget): Appliance[] {
  const subcategories = relatedSubcategories(product.subcategory);
  const rank = (a: Appliance, b: Appliance) =>
    subcategories.indexOf(a.subcategory) - subcategories.indexOf(b.subcategory) ||
    Number(isOutOfStock(a)) - Number(isOutOfStock(b)) ||
    Math.abs(a.price - product.price) - Math.abs(b.price - product.price) ||
    Number(b.brand === product.brand) - Number(a.brand === product.brand) ||
    a.id - b.id;

  return candidates
    .filter(
      (item, index, all) =>
        item.id !== product.id &&
        all.findIndex((other) => other.id === item.id) === index &&
        item.category === product.category &&
        subcategories.includes(item.subcategory)
    )
    .sort(rank)
    .slice(0, RELATED_LIMIT);
}

/**
 * The add-ons configured for a product's subcategory, in the configured order,
 * leaving out any that aren't among the candidates (unpublished) or are out of
 * stock. Null when there's nothing to show.
 */
export function productAddOns(
  candidates: Appliance[],
  product: Pick<Appliance, "id" | "subcategory">
): { heading: string; products: Appliance[] } | null {
  const config = PRODUCT_ADD_ONS[product.subcategory];
  if (!config) return null;
  const byId = new Map(candidates.map((item) => [item.id, item]));
  const products = config.productIds
    .filter((id) => id !== product.id)
    .map((id) => byId.get(id))
    .filter((item): item is Appliance => item !== undefined && !isOutOfStock(item));
  return products.length > 0 ? { heading: config.heading, products } : null;
}

/**
 * Stock is stored as a label ("In Stock" / "Low Stock" / "Out of Stock"), so the
 * rule lives here rather than being re-spelled wherever availability is needed -
 * the product page states it in two places, its markup and its OpenGraph tags.
 */
export function isOutOfStock(product: { status: string }): boolean {
  return product.status.toLowerCase().includes("out");
}

export function toCatalogProduct(product: Appliance): CatalogProduct {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    price: product.price,
    status: product.status,
    image: product.image,
    imageSet: {
      thumbnail: product.imageSet.thumbnail,
      card: product.imageSet.card,
    },
    isFeatured: product.isFeatured,
  };
}

/**
 * What the homepage's featured section actually renders: the flagged products
 * if there are any, otherwise the ones the configured columns point at. Shared
 * with FeaturedProductsGrid's own branch so the page sends exactly the products
 * the grid will use - 117 products in the payload to render four is not a trade
 * worth making.
 */
export function featuredSelection(
  inventory: Appliance[],
  columns: { topProductId: number; bottomProductId: number | null }[]
): Appliance[] {
  const flagged = inventory.filter((product) => product.isFeatured);
  if (flagged.length > 0) return flagged;

  const byId = new Map(inventory.map((product) => [product.id, product]));
  return columns.flatMap((column) =>
    [column.topProductId, column.bottomProductId]
      .filter((id): id is number => typeof id === "number")
      .map((id) => byId.get(id))
      .filter((product): product is Appliance => product !== undefined)
  );
}

/**
 * The catalog grids' selection rules. Shared so the server page that renders a
 * grid and the JSON-LD describing it select the same products - a list that
 * disagrees with the markup is what gets the enhancement dropped.
 */
export function productsInCategory(
  inventory: Appliance[],
  categoryLabel: string
): Appliance[] {
  const label = categoryLabel.trim().toLowerCase();
  return inventory.filter((product) => product.category.toLowerCase() === label);
}

export function productsInSubcategory(
  products: Appliance[],
  subSlug: string | undefined
): Appliance[] {
  if (!subSlug) return products;
  return products.filter((product) => product.subcategory === subSlug);
}

export function productsForBrand(inventory: Appliance[], brandName: string): Appliance[] {
  const name = brandName.trim().toLowerCase();
  return inventory.filter((product) => product.brand.toLowerCase() === name);
}

/**
 * Client-side fetch of inventory via the products API. Rejects when the API
 * can't answer, rather than resolving to an empty list that reads as "we sell
 * nothing".
 */
export async function fetchInventoryClient(): Promise<Appliance[]> {
  const endpoint = apiUrl("/products") || "/api/products";
  const res = await fetch(endpoint, { cache: "no-store" });
  if (!res.ok) throw new Error(`Products API answered ${res.status}`);
  const data = (await res.json()) as { success?: boolean; products?: Appliance[] };
  if (!data.success || !Array.isArray(data.products)) {
    throw new Error("Products API returned no product list");
  }
  return data.products;
}

export async function fetchProductByParamClient(param: string): Promise<Appliance | null> {
  const endpoint = apiUrl(`/products/${encodeURIComponent(param)}`) || `/api/products/${encodeURIComponent(param)}`;
  try {
    const res = await fetch(endpoint, { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as { success?: boolean; product?: Appliance };
    if (data.success && data.product) return data.product;
  } catch {
    /* fall through */
  }
  return null;
}
