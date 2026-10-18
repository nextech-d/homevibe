"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { productHref, type Appliance } from "../data/products";
import type { SearchResultsHandle } from "./SearchResults";

const loadSearchResults = () => import("./SearchResults");
// Client-only and absolutely positioned under the box: nothing to render on
// the server, and nothing moves when it arrives.
const SearchResults = dynamic(loadSearchResults, { ssr: false });

type SearchPopoverProps = {
  /** Focus the input on mount - the mobile search row opens for typing. */
  autoFocus?: boolean;
  /** Called after the search sends the shopper somewhere, so a host can close. */
  onNavigate?: () => void;
};

/**
 * The header's search box. The box itself renders with the page; the results
 * panel (SearchResults) is fetched the first time the box is hovered,
 * touched or focused, and shown once there's something typed.
 */
export default function SearchPopover({ autoFocus = false, onNavigate }: SearchPopoverProps) {
  const router = useRouter();
  const popoverRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<SearchResultsHandle>(null);
  const [search, setSearch] = useState("");
  const [showSearchPop, setShowSearchPop] = useState(false);
  // Set on first focus and kept: the panel then stays mounted, holding its
  // last answer for the next time the box opens.
  const [activated, setActivated] = useState(false);
  const query = search.trim();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowSearchPop(false);
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
      onNavigate?.();
    },
    [router, onNavigate]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showSearchPop && query && resultsRef.current?.handleKey(e)) return;
    // Enter with nothing highlighted searches the whole catalogue.
    if (e.key === "Enter" && query) {
      e.preventDefault();
      router.push(`/search?q=${encodeURIComponent(query)}`);
      setShowSearchPop(false);
      onNavigate?.();
      return;
    }
    if (e.key === "Escape") setShowSearchPop(false);
  };

  // Started on the first sign of interest, so the panel is usually there by
  // the first keystroke.
  const preload = () => void loadSearchResults();

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
          aria-expanded={showSearchPop && !!query}
          aria-controls="search-results"
          aria-autocomplete="list"
          value={search}
          onPointerEnter={preload}
          onTouchStart={preload}
          onFocus={() => {
            preload();
            setActivated(true);
            setShowSearchPop(true);
          }}
          onKeyDown={handleKeyDown}
          onChange={(e) => {
            setSearch(e.target.value);
            setShowSearchPop(true);
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
              inputRef.current?.focus();
            }}
            className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-neutral-500 transition hover:bg-neutral-200 hover:text-neutral-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a85414]"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {activated && (
        <SearchResults
          open={showSearchPop}
          controls={resultsRef}
          query={query}
          search={search}
          onPick={navigateToProduct}
          onViewAll={() => {
            setShowSearchPop(false);
            onNavigate?.();
          }}
        />
      )}
    </div>
  );
}
