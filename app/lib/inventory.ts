import { type Appliance } from "../data/products";
import type { ProductImageSet } from "./productImages";
import { apiUrl } from "./api-client";

export type { Appliance };

/**
 * What a catalog card and its add-to-cart button actually read. Grids are handed
 * this rather than whole products: a 53-item brand page would otherwise ship
 * every description, spec sheet and gallery URL it never renders, twice - once
 * in the HTML and again in the flight payload.
 */
export type CatalogProduct = Pick<
  Appliance,
  "id" | "slug" | "name" | "price"
> & {
  image: string;
  imageSet: Pick<ProductImageSet, "thumbnail" | "card">;
  /** Drives the homepage grid's choice of layout. */
  isFeatured?: boolean;
};

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

/** Client-side fetch of inventory via the products API. */
export async function fetchInventoryClient(): Promise<Appliance[]> {
  const endpoint = apiUrl("/products") || "/api/products";
  try {
    const res = await fetch(endpoint, { cache: "no-store" });
    if (!res.ok) return [];
    const data = (await res.json()) as { success?: boolean; products?: Appliance[] };
    if (data.success && Array.isArray(data.products) && data.products.length > 0) {
      return data.products;
    }
  } catch {
    /* fall through */
  }
  return [];
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
