import { notFound } from "next/navigation";
import { getPublishedProductByParam, getRelatedCandidates, listProductsForSitemap } from "../../lib/inventory.server";
import { productAddOns, relatedProducts, toCatalogProduct } from "../../lib/inventory";
import ProductDetail from "./ProductDetail";
import { descriptionLooksLikeHtml, sanitizeDescriptionHtml } from "../../lib/descriptionHtml";

type Props = {
  params: Promise<{ id: string }>;
};

/**
 * Cached like the homepage: refreshed on demand by every admin save through
 * /api/revalidate, with 60 seconds as the backstop.
 */
export const revalidate = 60;

/**
 * Every published product is rendered at build time, so the first shopper to
 * open one - or the link prefetch before they tap it - gets a cached page
 * instead of waiting a second or more for it to render. Revalidation is
 * unchanged, and a product added after the deploy is still rendered on its
 * first visit (dynamicParams stays on).
 *
 * If the list can't be read the build carries on with none prerendered, as
 * before: a database blip shouldn't block a deploy, and every page still
 * renders on demand and throws on a failed query, keeping the last good copy.
 */
export async function generateStaticParams(): Promise<{ id: string }[]> {
  try {
    return (await listProductsForSitemap()).map((product) => ({ id: product.slug }));
  } catch (error) {
    console.warn("Product pages not prerendered: couldn't list products", error);
    return [];
  }
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  const product = id ? await getPublishedProductByParam(id) : null;

  // The layout redirects a numeric id to the slug URL before we get here.
  if (!product) notFound();

  // Chosen here so the rail is in the initial HTML: it was the last thing on
  // the page still waiting for the browser's catalogue fetch.
  const candidates = await getRelatedCandidates(product);
  const related = relatedProducts(candidates, product).map(toCatalogProduct);
  const addOnSelection = productAddOns(candidates, product);
  const addOns = addOnSelection
    ? { heading: addOnSelection.heading, products: addOnSelection.products.map(toCatalogProduct) }
    : null;

  // Sanitised here, on the server, so the HTML in the page is always clean
  // and the sanitiser never ships to the browser.
  const descriptionHtml = descriptionLooksLikeHtml(product.description)
    ? sanitizeDescriptionHtml(product.description)
    : null;

  return (
    <ProductDetail
      product={product}
      related={related}
      addOns={addOns}
      descriptionHtml={descriptionHtml}
    />
  );
}
