"use client";

import ProductCard from "../components/ProductCard";
import { useAddToCart } from "../hooks/useAddToCart";
import type { CatalogProduct } from "../lib/inventory";

/** The results as cards, client-side only for Add to cart; the matching is done on the server. */
export default function SearchResultsGrid({ products }: { products: CatalogProduct[] }) {
  const { handleAddToCart, addedIds } = useAddToCart();
  return (
    <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-8 lg:grid-cols-4">
      {products.map((appliance) => (
        <ProductCard
          key={appliance.id}
          appliance={appliance}
          onAddToCart={handleAddToCart}
          added={addedIds[appliance.id]}
        />
      ))}
    </div>
  );
}
