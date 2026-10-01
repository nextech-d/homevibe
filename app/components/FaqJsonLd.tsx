import { getFaqItemsData } from "../lib/storefront.server";
import { getSiteUrl } from "../lib/seo";
import { serializeJsonLd } from "../lib/json-ld";

export default async function FaqJsonLd() {
  const items = await getFaqItemsData();
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
