import { getSiteUrl } from "../lib/seo";
import { serializeJsonLd } from "../lib/json-ld";
import type { FaqItemData } from "../lib/storefront";

/**
 * FAQPage markup for the homepage FAQ.
 *
 * It used to sit in the root layout, so every route - products, categories,
 * the cart - claimed to be an FAQ page about questions that were nowhere in
 * their markup. Structured data has to describe the page it is on, and the
 * questions only appear on the homepage. Takes the items the page renders, so
 * the two cannot diverge.
 */
export default function FaqJsonLd({ items }: { items: FaqItemData[] }) {
  if (items.length === 0) return null;

  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
    url: getSiteUrl(),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
