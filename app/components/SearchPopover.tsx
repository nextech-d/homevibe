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

type SearchPopoverProps = {
  /** Focus the input on mount - the mobile search row opens for typing. */
  autoFocus?: boolean;
  /** Called after the search sends the shopper somewhere, so a host can close. */
  onNavigate?: () => void;
};

export default function SearchPopover({ autoFocus = false, onNavigate }: SearchPopoverProps) {
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

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  const navigateToProduct = useCallback(
    (product: Pick<Appliance, "id" | "slug">) => {
      router.push(productHref(product));
      setSearch("");
      setShowSearchPop(false);
      setActiveIndex(-1);
      onNavigate?.();
    },
    [router, onNavigate]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Enter with nothing highlighted searches the whole catalogue.
    if (e.key === "Enter" && activeIndex < 0 && search.trim()) {
      e.preventDefault();
      router.push(`/search?q=${encodeURIComponent(search.trim())}`);
      setShowSearchPop(false);
      onNavigate?.();
      return;
    }
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
          type="search"
          enterKeyHint="search"
          aria-label="Search products, brands and categories"
          placeholder="Search for products, brands or categories"
          role="combobox"
          aria-expanded={showSearchPop && !!search.trim()}
          aria-controls="search-results"
          aria-autocomplete="list"
          value={search}
          onFocus={() => setShowSearchPop(true)}
          onKeyDown={handleKeyDown}
          onChange={(e) => {
            setSearch(e.target.value);
            setShowSearchPop(true);
            setActiveIndex(-1);
          }}
          // The clear button's room is only kept once there is text to clear,
          // and phones get a slightly smaller placeholder, so the full prompt
          // fits at 360px.
          className={`h-11 w-full appearance-none rounded-full border border-transparent bg-neutral-100 pl-10 ${search ? "pr-11" : "pr-4"} text-sm text-neutral-950 outline-none transition-colors placeholder:text-neutral-600 max-sm:placeholder:text-[13px] hover:bg-neutral-200/70 focus:border-neutral-300 focus:bg-white focus:ring-4 focus:ring-[#a85414]/15 [&::-webkit-search-cancel-button]:hidden`}
        />
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500"
        />
        {search && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setShowSearchPop(false);
              setActiveIndex(-1);
              inputRef.current?.focus();
            }}
            className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-neutral-500 transition hover:bg-neutral-200 hover:text-neutral-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a85414]"
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
              onClick={() => {
                setShowSearchPop(false);
                onNavigate?.();
              }}
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
