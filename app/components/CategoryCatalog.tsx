"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  getSubcategory,
  getSubcategoryLabel,
  categoryHref,
  type Category,
} from "../data/categories";
import ProductCard from "./ProductCard";
import { useAddToCart } from "../hooks/useAddToCart";
import { useInventory } from "../context/ProductsContext";
import { ChevronRight, SlidersHorizontal, ArrowUpDown } from "lucide-react";

type CategoryCatalogProps = {
  category: Category;
  subSlug?: string;
};

export default function CategoryCatalog({ category, subSlug }: CategoryCatalogProps) {
  const { handleAddToCart, addedIds } = useAddToCart();
  const inventory = useInventory();
  const subcategoryMeta = subSlug ? getSubcategory(category.slug, subSlug, category) : undefined;
  const [sortBy, setSortBy] = useState<string>("default");
  const subNavItems =
    category.subcategories.length === 1 &&
    category.subcategories[0].slug === category.slug
      ? []
      : category.subcategories;

  const categoryProducts = useMemo(() => {
    return inventory.filter(
      (p) => p.category.toLowerCase() === category.label.toLowerCase()
    );
  }, [category.label, inventory]);

  const filteredProducts = useMemo(() => {
    let result = [...categoryProducts];

    if (subSlug) {
      result = result.filter((p) => p.subcategory === subSlug);
    }

    if (sortBy === "price-asc") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-desc") {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === "name-asc") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [categoryProducts, subSlug, sortBy]);

  const activeSubLabel = subSlug ? getSubcategoryLabel(category.slug, subSlug, category) : null;

  if (subSlug && !subcategoryMeta) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-6">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold text-neutral-900">Subcategory Not Found</h1>
          <p className="mt-2 text-sm text-neutral-500">
            This subcategory doesn&apos;t exist under {category.label}.
          </p>
          <Link
            href={categoryHref(category.slug)}
            className="mt-6 inline-block rounded-full bg-neutral-900 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white"
          >
            View All {category.label}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] pb-24">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <nav className="mb-8 flex flex-wrap items-center justify-center gap-2 text-center text-xs font-bold uppercase tracking-widest text-neutral-500">
          <Link href="/" className="transition hover:text-neutral-900">
            Home
          </Link>
          <ChevronRight className="h-3 w-3" />
          {activeSubLabel ? (
            <>
              <Link href={categoryHref(category.slug)} className="transition hover:text-neutral-900">
                {category.label}
              </Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-neutral-900">{activeSubLabel}</span>
            </>
          ) : (
            <span className="text-neutral-900">{category.label}</span>
          )}
        </nav>

        <header className="mx-auto mb-8 max-w-3xl border-b border-neutral-300/70 pb-8 text-center">
          <h1 className="text-3xl font-black uppercase tracking-tight text-neutral-900 md:text-5xl">
            {activeSubLabel ?? category.label}{" "}
            {!activeSubLabel && (
              <span className="font-light text-neutral-400">Collection</span>
            )}
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-neutral-500">
            {category.description}
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link
              href={categoryHref(category.slug)}
              className={`rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-wider transition ${
                !subSlug
                  ? "bg-neutral-900 text-white"
                  : "border border-neutral-300 text-neutral-600 hover:border-neutral-400"
              }`}
            >
              All
            </Link>
            {subNavItems.map((sub) => (
              <Link
                key={sub.slug}
                href={categoryHref(category.slug, sub.slug)}
                className={`rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-wider transition ${
                  subSlug === sub.slug
                    ? "bg-neutral-900 text-white"
                    : "border border-neutral-300 text-neutral-600 hover:border-neutral-400"
                }`}
              >
                {sub.label}
              </Link>
            ))}
          </div>
        </header>

        <div className="mx-auto mb-6 flex max-w-3xl flex-col items-center justify-between gap-3 rounded-2xl border border-neutral-200/60 bg-[color:var(--surface)] px-4 py-3 sm:flex-row">
          <span className="text-xs font-bold text-neutral-500">
            Displaying <span className="text-neutral-900">{filteredProducts.length}</span> products
          </span>
          <div className="flex shrink-0 items-center gap-2">
            <ArrowUpDown className="h-3.5 w-3.5 text-neutral-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="cursor-pointer border-0 bg-transparent pr-6 text-xs font-bold text-neutral-700 focus:ring-0"
            >
              <option value="default">Default Arrangement</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name-asc">Product Name (A-Z)</option>
            </select>
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="rounded-3xl border border-neutral-200/60 bg-[color:var(--surface)] py-20 text-center">
            <SlidersHorizontal className="mx-auto mb-4 h-12 w-12 stroke-[1.25] text-neutral-300" />
            <h3 className="text-sm font-bold text-neutral-800">No matching appliances</h3>
            <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-neutral-500">
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
