"use client";

import { useState } from "react";
import type { FaqItemData } from "../lib/storefront";

/**
 * The homepage FAQ. Only the open/closed state is client-side; every question
 * and answer is server-rendered, which is what the FAQPage markup alongside it
 * describes.
 */
export default function HomeFaq({ items }: { items: FaqItemData[] }) {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  if (items.length === 0) return null;

  return (
    <section id="faq" className="mx-auto mt-24 mb-12 max-w-5xl px-6">
      <div className="mb-12 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-black">
          Frequently Asked Questions
        </h2>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {items.map((faq, i) => (
          <div
            key={faq.id}
            className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm"
          >
            <button
              onClick={() => setOpenFAQ(openFAQ === i ? null : i)}
              aria-expanded={openFAQ === i}
              className="flex w-full items-center justify-between p-5 text-left transition-colors hover:bg-neutral-50 focus:outline-none"
            >
              <h3 className="pr-4 text-sm font-semibold text-black">{faq.question}</h3>
              <svg
                className={`h-4 w-4 shrink-0 text-black/50 transition-transform duration-300 ${
                  openFAQ === i ? "rotate-180" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {/* Rendered either way so the answer is in the HTML; hidden by CSS
                when collapsed, which is what the markup promises a crawler. */}
            <div className={openFAQ === i ? "px-5 pb-5" : "hidden"}>
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
