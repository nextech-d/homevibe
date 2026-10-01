import { isOutOfStock } from "../lib/inventory";

/**
 * og:type=product and the price and availability that go with it.
 *
 * Next's Metadata API cannot express the product type, and its docs prescribe
 * rendering unsupported tags in the page - so buildPageMetadata is passed
 * ogType "product" to leave og:type out, and these are the only ones emitted.
 *
 * Attribute is `property`, not `name`: that is what OpenGraph consumers read,
 * and the `other` metadata field would have produced `name`.
 */
export default function ProductOpenGraph({
  product,
}: {
  product: { price: number; brand: string; status: string };
}) {
  return (
    <>
      <meta property="og:type" content="product" />
      <meta property="product:price:amount" content={String(product.price)} />
      <meta property="product:price:currency" content="KES" />
      <meta
        property="product:availability"
        content={isOutOfStock(product) ? "oos" : "instock"}
      />
      <meta property="product:brand" content={product.brand} />
    </>
  );
}
