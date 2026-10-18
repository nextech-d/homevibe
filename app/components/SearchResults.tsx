"use client";

import React, { useEffect, useImperativeHandle, useState, type Ref } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "../lib/formatPrice";
import { PRODUCT_IMAGE_SIZES } from "../lib/productImages";
import type { SearchSuggestion } from "../api/search/route";

/** How long typing has to pause before the query goes out. */
const DEBOUNCE_MS = 200;

/** The last answer the endpoint gave, and which query it was for. */
type Answer = { query: string; total: number; results: SearchSuggestion[] } | { query: string; failed: true };

/** What the search box hands down: the arrow keys and Enter belong to the list. */
export type SearchResultsHandle = {
  /** True when the key was used here; false leaves it to the box. */
  handleKey: (e: React.KeyboardEvent) => boolean;
};

type Props = {
  /** Hidden rather than unmounted when closed, so reopening shows the last answer at once. */
  open: boolean;
  query: string;
  /** The text as typed, for the "no matches" line and the View all link. */
  search: string;
  onPick: (product: Pick<SearchSuggestion, "id" | "slug">) => void;
  onViewAll: () => void;
  /** Not `ref`: a plain prop survives next/dynamic's wrapper whatever it does with refs. */
  controls: Ref<SearchResultsHandle>;
};

/**
 * The search box's results panel: loaded the first time the box is focused,
 * so its code isn't part of every page. Asks /api/search once typing pauses,
 * each request cancelling the one before, so a slow answer to "hi" can never
 * land on top of "hisense"; the last answer stays on screen while the next is
 * on its way.
 */
export default function SearchResults({ open, query, search, onPick, onViewAll, controls }: Props) {
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [active, setActive] = useState<{ query: string; index: number }>({ query: "", index: -1 });
  // Typing resets the highlight: an index kept for another query means none.
  const activeIndex = active.query === query ? active.index : -1;

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
  const results = answer && !("failed" in answer) ? answer.results : [];
  const totalMatches = answer && !("failed" in answer) ? answer.total : 0;
  // Nothing to show until the first answer arrives; after that the previous
  // answer stands in while a new one loads.
  const waiting = answer === null || (answer.query !== query && results.length === 0 && !failed);

  useImperativeHandle(controls, () => ({
    handleKey: (e) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive({ query, index: Math.min(activeIndex + 1, results.length - 1) });
        return true;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive({ query, index: Math.max(activeIndex - 1, 0) });
        return true;
      }
      if (e.key === "Enter" && activeIndex >= 0 && results[activeIndex]) {
        e.preventDefault();
        onPick(results[activeIndex]);
        return true;
      }
      return false;
    },
  }));

  if (!open || !query) return null;

  return (
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
              onClick={() => onPick(product)}
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
              <span className="shrink-0 text-xs font-bold text-black">{formatPrice(product.price)}</span>
            </div>
          ))
        )}
      </div>
      {totalMatches > 5 && (
        <Link
          href={`/search?q=${encodeURIComponent(search)}`}
          onClick={onViewAll}
          className="block border-t border-neutral-100 p-3 text-center text-[10px] font-bold uppercase tracking-wider text-black hover:bg-neutral-50"
        >
          View all {totalMatches} results
        </Link>
      )}
    </div>
  );
}
