"use client";

import { useId, useState } from "react";
import type { FaqItemData } from "../lib/storefront";
import FaqAnswer from "./FaqAnswer";
import { raisedSurface, sectionHeading } from "./homeSurfaces";

/**
 * The homepage FAQ. Only the open/closed state is client-side; every question
 * and answer is server-rendered, which is what the FAQPage markup alongside it
 * describes.
 */
export default function HomeFaq({ items }: { items: FaqItemData[] }) {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const baseId = useId();

  if (items.length === 0) return null;

  return (
    <section id="faq" className="mt-20 mb-8">
      <h2 className={`mb-6 ${sectionHeading}`}>Frequently asked questions</h2>
      <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2">
        {items.map((faq, i) => {
          const buttonId = `${baseId}-q${i}`;
          const panelId = `${baseId}-a${i}`;
          return (
            <div
              key={faq.id}
              // The focus ring goes on the panel, outside it, so it follows the rounded
              // corners; drawn on the button, overflow-hidden clipped it square.
              className={`${raisedSurface} overflow-hidden has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-[#a85414]`}
            >
              {/* The heading holds the button, not the other way round: a
                  button may only contain phrasing content. */}
              <h3>
                <button
                  id={buttonId}
                  type="button"
                  onClick={() => setOpenFAQ(openFAQ === i ? null : i)}
                  aria-expanded={openFAQ === i}
                  aria-controls={panelId}
                  className="flex min-h-14 w-full items-center justify-between gap-4 px-5 py-4 text-left text-[15px] font-semibold leading-snug text-neutral-950 transition-colors hover:bg-neutral-50 focus-visible:outline-none"
                >
                  <span>{faq.question}</span>
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
              </h3>
              {/* Rendered either way so the answer is in the HTML; hidden by CSS
                  when collapsed, which is what the markup promises a crawler. */}
              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                className={openFAQ === i ? "px-5 pb-5" : "hidden"}
              >
                <p className="border-t border-[#DCE0E7] pt-3 text-sm leading-relaxed text-neutral-700">
                  <FaqAnswer answer={faq.answer} />
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
