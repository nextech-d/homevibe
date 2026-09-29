import { buildBreadcrumbJsonLd, type Crumb } from "../lib/breadcrumbs";

/**
 * Emits BreadcrumbList structured data for the trail shown on the page.
 * Renders nothing when there is no trail worth describing.
 */
export default function BreadcrumbJsonLd({ crumbs }: { crumbs: Crumb[] }) {
  if (crumbs.length < 2) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(buildBreadcrumbJsonLd(crumbs)),
      }}
    />
  );
}
