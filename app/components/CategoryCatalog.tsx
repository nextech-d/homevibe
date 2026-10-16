"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  getSubcategory,
  getSubcategoryLabel,
  categoryHref,
  visibleSubcategories,
  type Category,
} from "../data/categories";
import ProductCard from "./ProductCard";
import { useAddToCart } from "../hooks/useAddToCart";
import { type CatalogProduct } from "../lib/inventory";
import { SlidersHorizontal, ArrowUpDown } from "lucide-react";
import Breadcrumbs from "./Breadcrumbs";
import StatusPanel from "./StatusPanel";
import { chip, chipActive, focusRing, pageHeading, primaryButton, raisedSurface } from "./homeSurfaces";

type CategoryCatalogProps = {
  category: Category;
  subSlug?: string;
  /** Already filtered to this category and subcategory by the page, on the server. */
  products: CatalogProduct[];
};

export default function CategoryCatalog({ category, subSlug, products }: CategoryCatalogProps) {
  const { handleAddToCart, addedIds } = useAddToCart();
  const subcategoryMeta = subSlug ? getSubcategory(category.slug, subSlug, category) : undefined;
  const [sortBy, setSortBy] = useState<string>("default");
  // Same rule as the nav: a subcategory with nothing in it is not worth a pill.
  const shownSubcategories = visibleSubcategories(category);
  const subNavItems =
    shownSubcategories.length === 1 && shownSubcategories[0].slug === category.slug
      ? []
      : shownSubcategories;

  // Sorting is the only client-side concern left; the selection happens on the
  // server so the grid is in the initial HTML.
  const filteredProducts = useMemo(() => {
    const result = [...products];

    if (sortBy === "price-asc") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-desc") {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === "name-asc") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [products, sortBy]);

  const activeSubLabel = subSlug ? getSubcategoryLabel(category.slug, subSlug, category) : null;

  if (subSlug && !subcategoryMeta) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-6 py-16">
        <StatusPanel
          title="Subcategory not found"
          actions={
            <Link href={categoryHref(category.slug)} className={primaryButton}>
              View all {category.label.toLowerCase()}
            </Link>
          }
        >
          This subcategory doesn&apos;t exist under {category.label}.
        </StatusPanel>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <Breadcrumbs
          className="mb-6"
          items={
            activeSubLabel
              ? [
                  { label: "Home", href: "/" },
                  { label: category.label, href: categoryHref(category.slug) },
                  { label: activeSubLabel },
                ]
              : [{ label: "Home", href: "/" }, { label: category.label }]
          }
        />

        <header className="mb-8">
          <h1 className={pageHeading}>
            {activeSubLabel ?? (
              <>
                {category.label} <span className="text-neutral-600">collection</span>
              </>
            )}
          </h1>
          {category.description && (
            <p className="mt-3 max-w-[60ch] text-base leading-relaxed text-neutral-600">
              {category.description}
            </p>
          )}

          {subNavItems.length > 0 && (
            <nav aria-label={`${category.label} subcategories`} className="mt-6">
              <ul className="flex flex-wrap gap-2.5">
                <li>
                  <Link
                    href={categoryHref(category.slug)}
                    aria-current={!subSlug ? "page" : undefined}
                    className={!subSlug ? chipActive : chip}
                  >
                    All
                  </Link>
                </li>
                {subNavItems.map((sub) => (
                  <li key={sub.slug}>
                    <Link
                      href={categoryHref(category.slug, sub.slug)}
                      aria-current={subSlug === sub.slug ? "page" : undefined}
                      className={subSlug === sub.slug ? chipActive : chip}
                    >
                      {sub.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </header>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-neutral-600" aria-live="polite">
            <span className="font-semibold text-neutral-950 tabular-nums">{filteredProducts.length}</span>{" "}
            {filteredProducts.length === 1 ? "product" : "products"}
          </p>
          <div className="relative">
            <label htmlFor="category-sort" className="sr-only">
              Sort products
            </label>
            <ArrowUpDown
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-600"
            />
            <select
              id="category-sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={`min-h-11 cursor-pointer appearance-none rounded-full border border-[#DCE0E7] bg-white pl-10 pr-10 text-sm font-medium text-neutral-800 transition-colors hover:border-[#a85414] ${focusRing}`}
            >
              <option value="default">Recommended</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
              <option value="name-asc">Name (A to Z)</option>
            </select>
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className={`${raisedSurface} px-6 py-16 text-center`}>
            <SlidersHorizontal aria-hidden="true" className="mx-auto mb-4 h-10 w-10 stroke-[1.25] text-neutral-500" />
            <h2 className="text-lg font-semibold text-neutral-950">No matching appliances</h2>
            <p className="mx-auto mt-1 max-w-xs text-sm leading-relaxed text-neutral-600">
              Try a different subcategory.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-5 gap-y-8 lg:grid-cols-4">
            {filteredProducts.map((appliance) => (
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
