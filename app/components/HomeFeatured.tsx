"use client";

import ProductCard from "./ProductCard";
import FeaturedProductsGrid from "./FeaturedProductsGrid";
import { useAddToCart } from "../hooks/useAddToCart";
import type { CatalogProduct } from "../lib/inventory";
import type { FeaturedColumnIds } from "../lib/storefront";

/**
 * The homepage's featured grid. Client-side only for the add-to-cart state -
 * the products themselves are chosen on the server, so the cards are in the
 * initial HTML.
 */
export default function HomeFeatured({
  products,
  featuredColumns,
}: {
  products: CatalogProduct[];
  featuredColumns: FeaturedColumnIds[];
}) {
  const { handleAddToCart, addedIds } = useAddToCart();

  return (
    <FeaturedProductsGrid
      inventory={products}
      featuredColumns={featuredColumns}
      renderItem={(appliance) => (
        <ProductCard
          appliance={appliance}
          onAddToCart={handleAddToCart}
          added={addedIds[appliance.id]}
        />
      )}
    />
  );
}
