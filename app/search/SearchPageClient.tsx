"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getAllSearchResults } from "../lib/searchProducts";
import ProductCard from "../components/ProductCard";
import { useAddToCart } from "../hooks/useAddToCart";
import { useInventory } from "../context/ProductsContext";
import { pageHeading, primaryButton, raisedSurface } from "../components/homeSurfaces";

export default function SearchPageClient() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const inventory = useInventory();
  const results = getAllSearchResults(q, inventory);
  const { handleAddToCart, addedIds } = useAddToCart();

  return (
    <div className="min-h-screen pb-24">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <h1 className={pageHeading}>Search results</h1>
        {q ? (
          <p className="mt-3 text-base text-neutral-600" aria-live="polite">
            {results.length} result{results.length !== 1 ? "s" : ""} for &quot;{q}&quot;
          </p>
        ) : (
          <p className="mt-3 text-base text-neutral-600">Enter a search term to find products.</p>
        )}

        {results.length === 0 && q ? (
          <div className={`${raisedSurface} mt-10 px-6 py-16 text-center`}>
            <p className="text-lg font-semibold text-neutral-950">No products found.</p>
            <Link href="/" className={`mt-6 ${primaryButton}`}>
              Browse all products
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-8 lg:grid-cols-4">
            {results.map((appliance) => (
              <ProductCard
                key={appliance.id}
                appliance={appliance}
                onAddToCart={handleAddToCart}
                added={addedIds[appliance.id]}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
