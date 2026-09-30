import { absoluteUrl } from "./seo";

/**
 * One step in a breadcrumb trail. The final crumb is the current page and
 * carries no path - Google treats a trailing `item` as optional and omitting
 * it avoids a self-referencing link.
 */
export type Crumb = {
  name: string;
  path?: string;
};

type ListItem = {
  "@type": "ListItem";
  position: number;
  name: string;
  item?: string;
};

/**
 * Builds BreadcrumbList structured data.
 *
 * Keep the crumbs identical to the trail rendered on the page - Google expects
 * structured data to describe what the user actually sees, and a mismatch is
 * what gets the enhancement dropped.
 */
export function buildBreadcrumbJsonLd(crumbs: Crumb[]) {
  const trail = crumbs.filter((crumb) => crumb.name.trim());

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, index): ListItem => {
      const item: ListItem = {
        "@type": "ListItem",
        position: index + 1,
        name: crumb.name.trim(),
      };
      if (crumb.path) item.item = absoluteUrl(crumb.path);
      return item;
    }),
  };
}
