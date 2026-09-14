"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { searchProducts, getAllSearchResults } from "../lib/searchProducts";
import { formatPrice } from "../lib/formatPrice";
import { getProductThumbnail, PRODUCT_IMAGE_SIZES } from "../lib/productImages";
import { useInventory } from "../context/ProductsContext";
import { productHref, type Appliance } from "../data/products";

export default function SearchPopover() {
  const inventory = useInventory();
  const router = useRouter();
  const popoverRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [showSearchPop, setShowSearchPop] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const results = search.trim() ? searchProducts(search, 5, inventory) : [];
  const totalMatches = search.trim() ? getAllSearchResults(search, inventory).length : 0;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowSearchPop(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navigateToProduct = useCallback(
    (product: Pick<Appliance, "id" | "slug">) => {
      router.push(productHref(product));
      setSearch("");
      setShowSearchPop(false);
      setActiveIndex(-1);
    },
    [router]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSearchPop || !search.trim()) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIndex >= 0 && results[activeIndex]) {
      e.preventDefault();
      navigateToProduct(results[activeIndex]);
    } else if (e.key === "Escape") {
      setShowSearchPop(false);
      setActiveIndex(-1);
    }
  };

  return (
    <div className="relative min-w-0 w-full" ref={popoverRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={showSearchPop && !!search.trim()}
          aria-controls="search-results"
          aria-autocomplete="list"
          placeholder="Search products, brands, categories..."
          value={search}
          onFocus={() => setShowSearchPop(true)}
          onKeyDown={handleKeyDown}
          onChange={(e) => {
            setSearch(e.target.value);
            setShowSearchPop(true);
            setActiveIndex(-1);
          }}
          className="w-full rounded-xl border border-neutral-300 bg-white px-5 py-2.5 pl-11 text-xs text-black placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black/20"
        />
        <Search className="absolute left-4 top-3 h-4 w-4 text-neutral-400" />
        {search && (
          <button
            onClick={() => {
              setSearch("");
              setShowSearchPop(false);
              setActiveIndex(-1);
            }}
            className="absolute right-4 top-3 text-neutral-400 hover:text-black"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {showSearchPop && search.trim() && (
        <div
          id="search-results"
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xl animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="border-b border-neutral-100 bg-neutral-50 p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-black">
              {totalMatches} result{totalMatches !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {results.length === 0 ? (
              <div className="p-6 text-center text-xs font-medium text-black">
                No appliances matching &quot;{search}&quot;
              </div>
            ) : (
              results.map((product, idx) => (
                <div
                  key={product.id}
                  role="option"
                  aria-selected={activeIndex === idx}
                  onClick={() => navigateToProduct(product)}
                  className={`flex cursor-pointer items-center gap-3 border-b border-neutral-100 p-3 transition last:border-0 ${
                    activeIndex === idx ? "bg-neutral-100" : "hover:bg-neutral-50"
                  }`}
                >
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                    <div className="relative h-full w-full">
                      <Image
                        src={getProductThumbnail(product)}
                        alt={product.name}
                        fill
                        sizes={PRODUCT_IMAGE_SIZES.search}
                        className="object-contain p-0.5"
                      />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate text-xs font-bold text-black">{product.name}</h4>
                    <p className="text-[10px] font-semibold text-black">
                      {product.brand}
                      <span className="mx-1 text-black/40">·</span>
                      {product.category}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-bold text-black">
                    {formatPrice(product.price)}
                  </span>
                </div>
              ))
            )}
          </div>
          {totalMatches > 5 && (
            <Link
              href={`/search?q=${encodeURIComponent(search)}`}
              onClick={() => setShowSearchPop(false)}
              className="block border-t border-neutral-100 p-3 text-center text-[10px] font-bold uppercase tracking-wider text-black hover:bg-neutral-50"
            >
              View all {totalMatches} results
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
