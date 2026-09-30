import { notFound } from "next/navigation";
import { getPublishedProductByParam } from "../../lib/inventory.server";
import ProductDetail from "./ProductDetail";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  const product = id ? await getPublishedProductByParam(id) : null;

  // The layout redirects a numeric id to the slug URL before we get here.
  if (!product) notFound();

  return <ProductDetail product={product} />;
}
