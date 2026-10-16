"use client";

import { useState } from "react";
import type { FaqItemData } from "../lib/storefront";
import { raisedSurface, sectionHeading } from "./homeSurfaces";

/**
 * The homepage FAQ. Only the open/closed state is client-side; every question
 * and answer is server-rendered, which is what the FAQPage markup alongside it
 * describes.
 */
export default function HomeFaq({ items }: { items: FaqItemData[] }) {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  if (items.length === 0) return null;

  return (
    <section id="faq" className="mt-20 mb-8">
      <h2 className={`mb-6 ${sectionHeading}`}>Frequently asked questions</h2>
      <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2">
        {items.map((faq, i) => (
          <div
            key={faq.id}
            // The focus ring goes on the panel, outside it, so it follows the rounded
            // corners; drawn on the button, overflow-hidden clipped it square.
            className={`${raisedSurface} overflow-hidden has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-[#a85414]`}
          >
            <button
              onClick={() => setOpenFAQ(openFAQ === i ? null : i)}
              aria-expanded={openFAQ === i}
              className="flex min-h-14 w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-neutral-50 focus-visible:outline-none"
            >
              <h3 className="text-[15px] font-semibold leading-snug text-neutral-950">{faq.question}</h3>
              <svg
                aria-hidden="true"
                className={`h-4 w-4 shrink-0 text-neutral-500 transition-transform duration-300 ${
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
              <p className="border-t border-[#DCE0E7] pt-3 text-sm leading-relaxed text-neutral-700">
                {faq.answer}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
