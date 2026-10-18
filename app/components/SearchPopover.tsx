"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { formatPrice } from "../lib/formatPrice";
import { PRODUCT_IMAGE_SIZES } from "../lib/productImages";
import { productHref, type Appliance } from "../data/products";
import type { SearchSuggestion } from "../api/search/route";

/** How long typing has to pause before the query goes out. */
const DEBOUNCE_MS = 200;

/** The last answer the endpoint gave, and which query it was for. */
type Answer = { query: string; total: number; results: SearchSuggestion[] } | { query: string; failed: true };

type SearchPopoverProps = {
  /** Focus the input on mount - the mobile search row opens for typing. */
  autoFocus?: boolean;
  /** Called after the search sends the shopper somewhere, so a host can close. */
  onNavigate?: () => void;
};

export default function SearchPopover({ autoFocus = false, onNavigate }: SearchPopoverProps) {
  const router = useRouter();
  const popoverRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [showSearchPop, setShowSearchPop] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const [answer, setAnswer] = useState<Answer | null>(null);
  const query = search.trim();

  // Asked of /api/search once typing pauses, each request cancelling the one
  // before, so a slow answer to "hi" can never land on top of "hisense". The
  // last answer stays on screen while the next is on its way.
  useEffect(() => {
    if (!query) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(query)}&limit=5`, { signal: controller.signal })
        .then(async (res) => {
          const data = (await res.json()) as { success?: boolean; total?: number; results?: SearchSuggestion[] };
          if (!res.ok || !data.success || !Array.isArray(data.results)) throw new Error(`Search answered ${res.status}`);
          setAnswer({ query, total: data.total ?? data.results.length, results: data.results });
        })
        .catch((error: unknown) => {
          if (controller.signal.aborted) return;
          console.error("Search failed:", error);
          setAnswer({ query, failed: true });
        });
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const failed = answer !== null && "failed" in answer;
  const results = query && answer && !("failed" in answer) ? answer.results : [];
  const totalMatches = query && answer && !("failed" in answer) ? answer.total : 0;
  // Nothing to show until the first answer arrives; after that the previous
  // answer stands in while a new one loads.
  const waiting = answer === null || (answer.query !== query && results.length === 0 && !failed);

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
            <span className="text-[10px] font-bold uppercase tracking-wider text-black" aria-live="polite">
              {waiting ? "Searching…" : failed ? "Search unavailable" : `${totalMatches} result${totalMatches !== 1 ? "s" : ""}`}
            </span>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {waiting ? null : failed ? (
              <div className="p-6 text-center text-xs font-medium text-black">
                Search isn&apos;t working right now. Try again in a minute.
              </div>
            ) : results.length === 0 ? (
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
                        src={product.thumbnail}
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
