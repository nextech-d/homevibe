"use client";

import { useState } from "react";
import Link from "next/link";
import type { ProductFaqItem } from "../data/products";
import { parseFaqAnswer } from "../lib/faq-links";
import { raisedSurface, sectionHeading, textLink } from "./homeSurfaces";

/** An answer's text, with its [text](url) links as links where allowed. */
function FaqAnswer({ answer }: { answer: string }) {
  const parts = parseFaqAnswer(answer);
  // No links: the answer as one string, exactly as it rendered before.
  if (parts.length === 1 && !parts[0].href) return <>{parts[0].text}</>;
  return (
    <>
      {parts.map((part, i) => {
        if (!part.href) return part.text;
        const className = `${textLink} underline`;
        return part.href.startsWith("/") ? (
          <Link key={i} href={part.href} className={className}>
            {part.text}
          </Link>
        ) : (
          <a key={i} href={part.href} className={className}>
            {part.text}
          </a>
        );
      })}
    </>
  );
}

/**
 * Questions answered on a product's own page. Same shape as the homepage FAQ:
 * every answer is in the markup, with CSS hiding the closed ones, so the
 * FAQPage structured data emitted alongside describes content that is there.
 */
export default function ProductFaq({ items }: { items: ProductFaqItem[] }) {
  const [open, setOpen] = useState<number | null>(0);

  if (items.length === 0) return null;

  return (
    <section className="mt-20 w-full">
      <h2 className={`mb-6 ${sectionHeading}`}>Questions about this product</h2>
      {/* Two columns from md up, as the homepage FAQ does: a stack of short
          questions wastes the width the rest of the page uses. */}
      <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2">
        {items.map((faq, i) => (
          <div
            key={`${faq.question}-${i}`}
            // The ring goes on the panel, outside it, so it follows the rounded
            // corners; drawn on the button, overflow-hidden clipped it square.
            className={`${raisedSurface} overflow-hidden has-[>button:focus-visible]:outline-2 has-[>button:focus-visible]:outline-offset-2 has-[>button:focus-visible]:outline-[#a85414]`}
          >
            <button
              onClick={() => setOpen(open === i ? null : i)}
              aria-expanded={open === i}
              className="flex min-h-14 w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-neutral-50 focus-visible:outline-none"
            >
              <h3 className="text-[15px] font-semibold leading-snug text-neutral-950">{faq.question}</h3>
              <svg
                aria-hidden="true"
                className={`h-4 w-4 shrink-0 text-neutral-600 transition-transform duration-300 ${
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
              <p className="border-t border-[#DCE0E7] pt-3 text-sm leading-relaxed text-neutral-700">
                <FaqAnswer answer={faq.answer} />
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
