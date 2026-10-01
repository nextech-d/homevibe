import { buildCollectionJsonLd } from "../lib/collections";
import type { CatalogProduct } from "../lib/inventory";
import { serializeJsonLd } from "../lib/json-ld";

/**
 * Emits CollectionPage + ItemList for a catalog listing. Renders nothing for an
 * empty listing - an ItemList with no items describes nothing.
 */
export default function CollectionJsonLd({
  name,
  path,
  description,
  products,
}: {
  name: string;
  path: string;
  description?: string;
  products: CatalogProduct[];
}) {
  if (products.length === 0) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: serializeJsonLd(
          buildCollectionJsonLd({ name, path, description, products })
        ),
      }}
    />
  );
}
