"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SIGNATURE_BRANDS, PARTNER_BRANDS, brandHref, type Brand } from "../data/brands";
import { useInventory } from "../context/ProductsContext";
import { apiUrl } from "../lib/api-client";

type StorefrontBrand = Brand & {
  id?: number;
  logoUrl?: string | null;
  isFeatured?: boolean;
};

function productCountForBrand(brandName: string, inventory: { brand: string }[]): number {
  return inventory.filter((p) => p.brand.toLowerCase() === brandName.toLowerCase()).length;
}

function SignatureBrandCard({
  brand,
  productCount,
}: {
  brand: StorefrontBrand;
  productCount: number;
}) {
  return (
    <Link
      href={brandHref(brand.slug)}
      className="relative flex h-full min-h-[7.5rem] w-full flex-col overflow-hidden rounded-2xl border border-neutral-200/80 bg-gradient-to-br from-neutral-800 to-neutral-700 p-5 pb-9 text-white"
    >
      <span className="absolute right-3 top-3 rounded-full bg-white/10 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-neutral-300">
        Featured
      </span>
      <span className="block font-serif text-lg tracking-wide md:text-xl">
        {brand.name}
      </span>
      <span className="absolute bottom-3 right-3 text-[9px] font-semibold tabular-nums text-neutral-400">
        {productCount} {productCount === 1 ? "product" : "products"}
      </span>
    </Link>
  );
}

export default function FeaturedBrands() {
  const inventory = useInventory();
  const [brands, setBrands] = useState<StorefrontBrand[] | null>(null);

  useEffect(() => {
    const endpoint = apiUrl("/catalog/brands") || "/api/catalog/brands";
    fetch(endpoint, { cache: "no-store" })
      .then((res) => res.json())
      .then((data: { success?: boolean; brands?: StorefrontBrand[] }) => {
        if (data.success && Array.isArray(data.brands)) setBrands(data.brands);
        else setBrands([]);
      })
      .catch(() => setBrands([]));
  }, []);

  const featured = (brands ?? []).filter((brand) => brand.isFeatured);
  const others = (brands ?? []).filter((brand) => !brand.isFeatured);
  const featuredCards = featured.length > 0 ? featured : SIGNATURE_BRANDS;
  const partnerChips = brands ? others : PARTNER_BRANDS;

  return (
    <section id="featured-brands" className="mx-auto mt-24 max-w-5xl">
      <div className="mb-10 text-center">
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-black md:text-3xl">
          Featured Brands
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {featuredCards.map((brand) => (
          <SignatureBrandCard
            key={brand.slug}
            brand={brand}
            productCount={productCountForBrand(brand.name, inventory)}
          />
        ))}
      </div>

      {partnerChips.length > 0 && (
        <div className="mt-6 flex flex-wrap justify-center gap-2 rounded-2xl border border-neutral-200/60 bg-[color:var(--surface)] p-5">
          {partnerChips.map((brand) => (
            <Link
              key={brand.slug}
              href={brandHref(brand.slug)}
              className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2 text-xs font-semibold text-neutral-700"
            >
              {brand.name}
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
