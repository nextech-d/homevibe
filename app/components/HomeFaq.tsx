"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { FaqItemData } from "../lib/storefront";
import FaqAnswer from "./FaqAnswer";
import { focusRing, raisedSurfaceFromSm, sectionHeading } from "./homeSurfaces";

/**
 * The homepage FAQ. Only the open/closed state is client-side; every question
 * and answer is server-rendered, which is what the FAQPage markup alongside it
 * describes.
 *
 * One white panel, like the sections above it: the heading on the left from
 * 1024px up, the questions as one ruled list beside it. One column, so opening
 * a question never leaves a gap beside it the way a two-column grid did.
 */
export default function HomeFaq({ items }: { items: FaqItemData[] }) {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const baseId = useId();

  if (items.length === 0) return null;

  return (
    <section
      id="faq"
      aria-labelledby={`${baseId}-heading`}
      className={`${raisedSurfaceFromSm} mt-20 mb-8 grid gap-6 sm:px-10 sm:py-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-12`}
    >
      <h2 id={`${baseId}-heading`} className={sectionHeading}>
        Frequently asked questions
      </h2>
      <div className="border-t border-[#DCE0E7]">
        {items.map((faq, i) => {
          const open = openFAQ === i;
          const buttonId = `${baseId}-q${i}`;
          const panelId = `${baseId}-a${i}`;
          return (
            <div key={faq.id} className="border-b border-[#DCE0E7]">
              {/* The heading holds the button, not the other way round: a
                  button may only contain phrasing content. */}
              <h3>
                <button
                  id={buttonId}
                  type="button"
                  onClick={() => setOpenFAQ(open ? null : i)}
                  aria-expanded={open}
                  aria-controls={panelId}
                  className={`group flex min-h-14 w-full items-center justify-between gap-4 rounded-lg py-4 text-left text-base font-semibold leading-snug text-neutral-950 ${focusRing}`}
                >
                  <span className="group-hover:text-[#8f4710]">{faq.question}</span>
                  <span
                    aria-hidden="true"
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#DCE0E7] text-neutral-700 transition-[rotate,background-color,border-color] duration-300 group-hover:border-[#a85414] ${
                      open ? "rotate-180 border-[#a85414] bg-[#a85414]/10 text-[#8f4710]" : ""
                    }`}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </span>
                </button>
              </h3>
              {/* Rendered either way so the answer is in the HTML; hidden by CSS
                  when collapsed, which is what the markup promises a crawler. */}
              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                className={open ? "pb-5 pr-12" : "hidden"}
              >
                <p className="text-base leading-relaxed text-neutral-700">
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
