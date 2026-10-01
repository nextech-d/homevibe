import { absoluteUrl, getSiteUrl } from "../lib/seo";
import { getSeoContext } from "../lib/seo.server";
import { serializeJsonLd } from "../lib/json-ld";

export default async function SiteJsonLd() {
  const ctx = await getSeoContext();
  const siteUrl = getSiteUrl();

  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: ctx.siteName,
        url: siteUrl,
        email: ctx.site.email,
        telephone: ctx.site.phone,
        areaServed: ctx.site.region,
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: ctx.siteName,
        description: ctx.site.tagline,
        publisher: { "@id": `${siteUrl}/#organization` },
        potentialAction: {
          "@type": "SearchAction",
          target: `${absoluteUrl("/search")}?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
