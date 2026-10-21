import { SITE, shopStreetAddress } from "../config/site";
import { absoluteUrl, getSiteUrl } from "../lib/seo";
import { getSeoContext } from "../lib/seo.server";
import { serializeJsonLd } from "../lib/json-ld";

/** Other spellings people search for, so Google ties them to this shop. */
const ALTERNATE_NAMES = ["Home Vibe", "HomeVibe Kenya", "Home Vibe Kenya"];

/** SITE.social is a placeholder fallback, not a real profile: never in sameAs. */
const PLACEHOLDER_SOCIAL_URLS: readonly string[] = Object.values(SITE.social);

export default async function SiteJsonLd() {
  const ctx = await getSeoContext();
  const siteUrl = getSiteUrl();

  const sameAs = [ctx.site.facebookUrl, ctx.site.instagramUrl, ctx.site.tiktokUrl]
    .map((url) => url.trim())
    .filter((url) => url && !PLACEHOLDER_SOCIAL_URLS.includes(url));

  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ElectronicsStore",
        "@id": `${siteUrl}/#organization`,
        name: ctx.siteName,
        alternateName: ALTERNATE_NAMES,
        url: siteUrl,
        logo: absoluteUrl("/logo.png"),
        image: ctx.defaultOgImage,
        address: {
          "@type": "PostalAddress",
          streetAddress: shopStreetAddress(ctx.site.streetAddress),
          addressLocality: ctx.site.city,
          addressCountry: "KE",
        },
        telephone: ctx.site.phone.replace(/\s+/g, ""),
        email: ctx.site.email,
        areaServed: "KE",
        priceRange: "KSh",
        ...(sameAs.length > 0 ? { sameAs } : {}),
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: ctx.siteName,
        alternateName: "Home Vibe",
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
