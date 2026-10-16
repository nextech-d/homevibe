"use client";

import Link from "next/link";
import { brandHref, type Brand } from "../data/brands";
import { useInventory } from "../context/ProductsContext";
import { useNavBrands } from "../context/BrandsContext";
import { focusRing, raisedSurface, sectionHeading } from "./homeSurfaces";

function productCountForBrand(brandName: string, inventory: { brand: string }[]): number {
  return inventory.filter((p) => p.brand.toLowerCase() === brandName.toLowerCase()).length;
}

function SignatureBrandCard({
  brand,
  productCount,
}: {
  brand: Brand;
  productCount: number;
}) {
  return (
    <Link
      href={brandHref(brand.slug)}
      className={`${raisedSurface} relative flex h-full min-h-[7.5rem] w-full flex-col p-5 pb-9 text-neutral-950 transition-colors hover:border-[#c9ced8] ${focusRing}`}
    >
      <span className="absolute right-3 top-3 rounded-full border border-[#DCE0E7] px-2 py-0.5 text-[10px] font-semibold text-neutral-600">
        Featured
      </span>
      <span className="block text-lg font-semibold tracking-tight md:text-xl">
        {brand.name}
      </span>
      <span className="absolute bottom-3 right-3 text-xs font-medium tabular-nums text-neutral-600">
        {productCount} {productCount === 1 ? "product" : "products"}
      </span>
    </Link>
  );
}

export default function FeaturedBrands() {
  const inventory = useInventory();
  // Same brands as the nav, loaded server-side, so the cards and chips are in
  // the initial HTML. This used to fetch /catalog/brands itself and render an
  // empty section whenever that failed.
  const brands = useNavBrands();

  const featuredCards = brands.filter((brand) => brand.isFeatured);
  const partnerChips = brands.filter((brand) => !brand.isFeatured);

  return (
    <section id="featured-brands" className="mt-20">
      <h2 className={`mb-6 ${sectionHeading}`}>Brands we stock</h2>

      {/* No featured brands, no grid: an empty one still left its gap above
          the chips. */}
      {featuredCards.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {featuredCards.map((brand) => (
            <SignatureBrandCard
              key={brand.slug}
              brand={brand}
              productCount={productCountForBrand(brand.name, inventory)}
            />
          ))}
        </div>
      )}

      {partnerChips.length > 0 && (
        <div
          className={`flex flex-wrap gap-2.5 ${featuredCards.length > 0 ? "mt-6" : ""}`}
        >
          {partnerChips.map((brand) => (
            <Link
              key={brand.slug}
              href={brandHref(brand.slug)}
              className={`inline-flex min-h-11 items-center rounded-full border border-[#DCE0E7] bg-white px-5 text-[13px] font-medium text-neutral-800 transition-colors hover:border-[#a85414] hover:text-neutral-950 ${focusRing}`}
            >
              {brand.name}
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
