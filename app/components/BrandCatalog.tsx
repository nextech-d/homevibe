"use client";

import Link from "next/link";
import { type Brand } from "../data/brands";
import ProductCard from "./ProductCard";
import { useAddToCart } from "../hooks/useAddToCart";
import { type CatalogProduct } from "../lib/inventory";
import Breadcrumbs from "./Breadcrumbs";
import { pageHeading, primaryButton, raisedSurface } from "./homeSurfaces";

type BrandCatalogProps = {
  brand: Brand;
  /** Already filtered to this brand by the page, on the server. */
  products: CatalogProduct[];
};

export default function BrandCatalog({ brand, products }: BrandCatalogProps) {
  const { handleAddToCart, addedIds } = useAddToCart();

  return (
    <div className="min-h-screen pb-24">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <Breadcrumbs className="mb-6" items={[{ label: "Home", href: "/" }, { label: brand.name }]} />

        <header className="mb-8">
          <p className="text-sm font-medium text-neutral-600">
            {brand.origin} · {brand.tier === "signature" ? "Top brand" : "Partner brand"}
          </p>
          <h1 className={`mt-1 ${pageHeading}`}>{brand.name}</h1>
          <p className="mt-3 max-w-[60ch] text-base leading-relaxed text-neutral-600">
            Browse {products.length} {products.length === 1 ? "product" : "products"} from{" "}
            {brand.name} available at HomeVibe.
          </p>
        </header>

        {products.length === 0 ? (
          <div className={`${raisedSurface} px-6 py-16 text-center`}>
            <h2 className="text-lg font-semibold text-neutral-950">No products yet</h2>
            <p className="mx-auto mt-1 max-w-xs text-sm leading-relaxed text-neutral-600">
              We&apos;re adding {brand.name} items soon. Check back or browse all products.
            </p>
            <Link href="/#featured-products" className={`mt-6 ${primaryButton}`}>
              View featured products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-5 gap-y-8 lg:grid-cols-4">
            {products.map((appliance) => (
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
