import { getSiteUrl } from "../lib/seo";
import { serializeJsonLd } from "../lib/json-ld";

type FaqEntry = { question: string; answer: string };

/**
 * FAQPage markup for a page that shows an FAQ - the homepage's, or a
 * product's.
 *
 * It used to sit in the root layout, so every route claimed to be an FAQ page
 * about questions that were nowhere in its markup. Structured data has to
 * describe the page it is on, which is why this takes the items that page
 * renders and a url to match.
 */
export default function FaqJsonLd({ items, url }: { items: FaqEntry[]; url?: string }) {
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
    url: url ?? getSiteUrl(),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
