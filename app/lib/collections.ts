import { productHref } from "../data/products";
import type { CatalogProduct } from "./inventory";
import { absoluteUrl, getSiteUrl } from "./seo";

type CollectionInput = {
  /** The page's visible heading, so the markup and the data agree. */
  name: string;
  path: string;
  description?: string;
  products: CatalogProduct[];
};

/**
 * Builds CollectionPage structured data with the listing as an ItemList.
 *
 * The products must be the ones the page renders, in the order it renders them:
 * the pages select them server-side with the helpers in lib/inventory.ts and
 * pass the same array to the grid and to here.
 *
 * Each entry carries only position, url and name - Google's guidance for a
 * summary listing, where the detail belongs on the product page itself (which
 * already emits full Product markup).
 */
export function buildCollectionJsonLd({
  name,
  path,
  description,
  products,
}: CollectionInput) {
  const trimmedDescription = description?.trim();

  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    url: absoluteUrl(path),
    ...(trimmedDescription && { description: trimmedDescription }),
    // Ties the page to the WebSite node SiteJsonLd emits site-wide.
    isPartOf: { "@id": `${getSiteUrl()}/#website` },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: products.length,
      itemListElement: products.map((product, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: absoluteUrl(productHref(product)),
        name: product.name,
      })),
    },
  };
}
