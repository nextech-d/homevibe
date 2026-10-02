"use client";

import { useState } from "react";
import type { ProductFaqItem } from "../data/products";

/**
 * Questions answered on a product's own page. Same shape as the homepage FAQ:
 * every answer is in the markup, with CSS hiding the closed ones, so the
 * FAQPage structured data emitted alongside describes content that is there.
 */
export default function ProductFaq({ items }: { items: ProductFaqItem[] }) {
  const [open, setOpen] = useState<number | null>(0);

  if (items.length === 0) return null;

  return (
    <section className="mt-24 w-full border-t border-neutral-300/70 pt-12">
      <h2 className="mb-8 text-2xl font-bold tracking-tight text-neutral-950">
        Questions about this product
      </h2>
      {/* Two columns from md up, as the homepage FAQ does: a stack of short
          questions wastes the width the rest of the page uses. */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:items-start">
        {items.map((faq, i) => (
          <div
            key={`${faq.question}-${i}`}
            className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm"
          >
            <button
              onClick={() => setOpen(open === i ? null : i)}
              aria-expanded={open === i}
              className="flex w-full items-center justify-between p-5 text-left transition-colors hover:bg-neutral-50 focus:outline-none"
            >
              <h3 className="pr-4 text-sm font-semibold text-black">{faq.question}</h3>
              <svg
                className={`h-4 w-4 shrink-0 text-black/50 transition-transform duration-300 ${
                  open === i ? "rotate-180" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className={open === i ? "px-5 pb-5" : "hidden"}>
              <p className="border-t border-neutral-100 pt-3 text-xs leading-relaxed text-black">
                {faq.answer}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
