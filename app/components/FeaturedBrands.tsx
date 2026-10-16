"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { BUNDLED_BRAND_LOGOS } from "../data/brand-logos";
import { brandHref, type Brand } from "../data/brands";
import { useInventory } from "../context/ProductsContext";
import { useNavBrands } from "../context/BrandsContext";
import { focusRing, raisedSurfaceFromSm, sectionHeading } from "./homeSurfaces";

function productCountForBrand(brandName: string, inventory: { brand: string }[]): number {
  return inventory.filter((p) => p.brand.toLowerCase() === brandName.toLowerCase()).length;
}

/**
 * A brand's logo, or its name when there's none: an admin upload first, then
 * the bundled official logo. Fitted inside a fixed box, so marks of different
 * shapes read at one size; the image's alt is the name, which is the link's
 * accessible name either way.
 */
function BrandMark({ brand, size }: { brand: Brand; size: "tile" | "card" }) {
  const src = brand.logoUrl || BUNDLED_BRAND_LOGOS[brand.slug];
  if (!src) {
    return size === "tile" ? (
      <span className="min-w-0 leading-snug [overflow-wrap:anywhere]">{brand.name}</span>
    ) : (
      <span className="min-w-0 text-lg font-semibold tracking-tight [overflow-wrap:anywhere] md:text-xl">
        {brand.name}
      </span>
    );
  }
  const box = size === "tile" ? "h-[21px] w-[72px] sm:w-[84px]" : "h-[30px] w-24";
  return (
    <span className={`relative block shrink-0 ${box}`}>
      <Image
        src={src}
        alt={brand.name}
        fill
        sizes={size === "tile" ? "84px" : "96px"}
        className="object-contain object-left"
      />
    </span>
  );
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
        <BrandMark brand={brand} size="card" />
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
          single brand is left alone on a last line. White, so every official
          logo sits on the background it was drawn for. */}
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
                className={`group flex min-h-16 items-center justify-between gap-2 rounded-xl border border-[#DCE0E7] bg-white px-4 text-sm font-semibold text-neutral-800 transition-colors hover:border-[#a85414] hover:text-neutral-950 ${focusRing}`}
              >
                <BrandMark brand={brand} size="tile" />
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
