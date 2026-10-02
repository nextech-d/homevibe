import { notFound } from "next/navigation";
import { getInventory, getPublishedProductByParam } from "../../lib/inventory.server";
import { relatedProducts, toCatalogProduct } from "../../lib/inventory";
import ProductDetail from "./ProductDetail";

type Props = {
  params: Promise<{ id: string }>;
};

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
