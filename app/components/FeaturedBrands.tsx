"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { brandHref, type Brand } from "../data/brands";
import { useInventory } from "../context/ProductsContext";
import { useNavBrands } from "../context/BrandsContext";
import { focusRing, insetSurface, raisedSurfaceFromSm, sectionHeading } from "./homeSurfaces";

function productCountForBrand(brandName: string, inventory: { brand: string }[]): number {
  return inventory.filter((p) => p.brand.toLowerCase() === brandName.toLowerCase()).length;
}

function SignatureBrandCard({
  brand,
  productCount,
}: {
  brand: Brand;
  productCount: number | null;
}) {
  return (
    <Link
      href={brandHref(brand.slug)}
      className={`group flex h-full min-h-[7.5rem] w-full flex-col justify-between gap-4 rounded-2xl border border-[#DCE0E7] bg-white p-5 text-neutral-950 transition-colors hover:border-[#a85414] ${focusRing}`}
    >
      {/* In the flow, not pinned to the corners: a long name used to run
          under the badge and the count. */}
      <span className="flex items-start justify-between gap-3">
        <span className="min-w-0 text-lg font-semibold tracking-tight [overflow-wrap:anywhere] md:text-xl">
          {brand.name}
        </span>
        <span className="shrink-0 rounded-full border border-[#DCE0E7] px-2 py-0.5 text-[10px] font-semibold text-neutral-600">
          Featured
        </span>
      </span>
      <span className="flex items-center justify-between gap-3 text-xs font-medium tabular-nums text-neutral-600">
        {/* Nothing until the catalogue has loaded: counting an empty list
            printed "0 products" on every card first. */}
        <span>
          {productCount !== null &&
            `${productCount} ${productCount === 1 ? "product" : "products"}`}
        </span>
        <ArrowUpRight
          aria-hidden="true"
          className="h-4 w-4 text-neutral-500 transition-[translate,color] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#a85414]"
        />
      </span>
    </Link>
  );
}

export default function FeaturedBrands() {
  const inventory = useInventory();
  // Same brands as the nav, loaded server-side, so the cards and tiles are in
  // the initial HTML. This used to fetch /catalog/brands itself and render an
  // empty section whenever that failed.
  const brands = useNavBrands();
  const inventoryLoaded = inventory.length > 0;

  const featuredCards = brands.filter((brand) => brand.isFeatured);
  const partnerBrands = brands.filter((brand) => !brand.isFeatured);

  return (
    <section
      id="featured-brands"
      aria-labelledby="featured-brands-heading"
      className={`${raisedSurfaceFromSm} mt-20 sm:px-10 sm:py-10`}
    >
      <h2 id="featured-brands-heading" className={`mb-6 ${sectionHeading}`}>
        Brands we stock
      </h2>

      {/* No featured brands, no grid: an empty one still left its gap above
          the tiles. */}
      {featuredCards.length > 0 && (
        <ul className="grid list-none grid-cols-2 gap-3 pl-0 sm:grid-cols-3 lg:grid-cols-5">
          {featuredCards.map((brand) => (
            <li key={brand.slug}>
              <SignatureBrandCard
                brand={brand}
                productCount={inventoryLoaded ? productCountForBrand(brand.name, inventory) : null}
              />
            </li>
          ))}
        </ul>
      )}

      {/* Even tiles rather than pills of every width: rows line up, and no
          single brand is left alone on a last line. */}
      {partnerBrands.length > 0 && (
        <ul
          className={`grid list-none grid-cols-2 gap-3 pl-0 sm:grid-cols-3 lg:grid-cols-6 ${
            featuredCards.length > 0 ? "mt-3" : ""
          }`}
        >
          {partnerBrands.map((brand) => (
            <li key={brand.slug}>
              <Link
                href={brandHref(brand.slug)}
                className={`${insetSurface} group flex min-h-14 items-center justify-between gap-2 px-4 text-sm font-semibold text-neutral-800 transition-colors hover:border-[#a85414] hover:bg-white hover:text-neutral-950 ${focusRing}`}
              >
                <span className="min-w-0 leading-snug [overflow-wrap:anywhere]">{brand.name}</span>
                <ArrowUpRight
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0 text-neutral-500 transition-[translate,color] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#a85414]"
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
