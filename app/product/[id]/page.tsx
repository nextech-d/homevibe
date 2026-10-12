import { notFound } from "next/navigation";
import { getInventory, getPublishedProductByParam } from "../../lib/inventory.server";
import { relatedProducts, toCatalogProduct } from "../../lib/inventory";
import ProductDetail from "./ProductDetail";

type Props = {
  params: Promise<{ id: string }>;
};

/**
 * Cached like the homepage: refreshed on demand by every admin save through
 * /api/revalidate, with 60 seconds as the backstop.
 */
export const revalidate = 60;

/**
 * No product pages at build time - each is rendered on its first visit and
 * cached from then on. An empty list is what lets a dynamic route be cached
 * and revalidated at all; listing all 139 would only lengthen every deploy.
 */
export async function generateStaticParams() {
  return [];
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  const product = id ? await getPublishedProductByParam(id) : null;

  // The layout redirects a numeric id to the slug URL before we get here.
  if (!product) notFound();

  // Chosen here so the rail is in the initial HTML: it was the last thing on
  // the page still waiting for the browser's catalogue fetch.
  const related = relatedProducts(await getInventory(), product).map(toCatalogProduct);

  return <ProductDetail product={product} related={related} />;
}
