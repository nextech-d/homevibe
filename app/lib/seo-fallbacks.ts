import "server-only";

import type { SeoContext } from "./seo.server";

/** Google truncates descriptions around 155-160 chars. */
const MAX_DESCRIPTION = 155;

/**
 * Trims to a word boundary and strips trailing punctuation, so descriptions
 * never end mid-word like "Stainless steel fini…".
 */
export function truncateForMeta(text: string, max = MAX_DESCRIPTION): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;

  const slice = clean.slice(0, max - 1);
  const lastSpace = slice.lastIndexOf(" ");
  const cut = lastSpace > max * 0.6 ? slice.slice(0, lastSpace) : slice;
  return `${cut.replace(/[\s,;:.\-–—]+$/, "")}…`;
}

/**
 * Rich text (the admin saves descriptions as either HTML or markdown) reduced
 * to the plain prose a meta tag can carry. Tags become spaces rather than
 * vanishing, so "<p>one</p><p>two</p>" does not read as "onetwo".
 *
 * Single "_" is deliberately left alone: model numbers carry underscores far
 * more often than product copy uses underscore italics.
 */
export function plainTextForMeta(value: string): string {
  const withoutHtml = value
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]*>/g, " ");

  const decoded = withoutHtml
    .replace(/&nbsp;/gi, " ")
    .replace(/&quot;/gi, '"')
    .replace(/&(?:#39|apos);/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    // Last, so "&amp;lt;" does not decode twice into a tag.
    .replace(/&amp;/gi, "&");

  return decoded
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^\s{0,3}>\s?/gm, "")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s{0,3}(?:[-*+]|\d+[.)])\s+/gm, "")
    .replace(/^\s{0,3}(?:[-*_]\s*){3,}$/gm, " ")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/~~(.*?)~~/g, "$1")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * What a share preview says about a product: its own intro copy, stripped and
 * trimmed to length. Empty when the product has no description, leaving the
 * caller to fall back.
 *
 * Deliberately prefers `description` over `metaDescription`: most rows carry
 * the product name in `metaDescription`, which made every Facebook and X
 * preview repeat the title it sits under. The long-form `body` is not used -
 * it opens mid-topic and reads badly as a one-line preview.
 */
export function productSocialDescription(product: { description: string }): string {
  return truncateForMeta(plainTextForMeta(product.description ?? ""));
}

/** Joins sentence fragments, dropping empties and double punctuation. */
function sentences(...parts: (string | null | undefined)[]): string {
  return parts
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .map((part) => (/[.!?]$/.test(part) ? part : `${part}.`))
    .join(" ");
}

/** "Sub-Zero Classic Fridge" already names the brand — don't repeat it. */
function withBrand(name: string, brand: string): string {
  const trimmed = brand.trim();
  if (!trimmed) return name;
  return name.toLowerCase().includes(trimmed.toLowerCase()) ? name : `${trimmed} ${name}`;
}

/** Where we deliver, e.g. "Nairobi and East & Central Africa". */
function deliveryArea(ctx: SeoContext): string {
  const city = ctx.site.city.trim();
  const region = ctx.site.region.trim();
  if (city && region) return `${city} and ${region}`;
  return city || region;
}

type ProductLike = {
  name: string;
  brand: string;
  description: string;
  category?: string;
  subcategory?: string;
};

export function productMetaFallback(product: ProductLike, ctx: SeoContext) {
  const titled = withBrand(product.name, product.brand);
  const area = deliveryArea(ctx);

  return {
    title: titled,
    description: truncateForMeta(
      sentences(
        `Buy the ${titled}`,
        product.description,
        area && `Delivery across ${area}`
      )
    ),
  };
}

type BrandLike = {
  name: string;
  tier: "signature" | "partner";
  origin: string;
};

export function brandMetaFallback(brand: BrandLike, ctx: SeoContext) {
  const area = deliveryArea(ctx);
  const tier = brand.tier === "signature" ? "signature" : "partner";

  return {
    title: `${brand.name} Appliances`,
    description: truncateForMeta(
      sentences(
        `Shop ${brand.name} at ${ctx.siteName}`,
        brand.origin.trim() && `A ${tier} brand from ${brand.origin.trim()}`,
        area && `Delivery across ${area}`
      )
    ),
  };
}

type CategoryLike = {
  label: string;
  description: string;
};

export function categoryMetaFallback(category: CategoryLike, ctx: SeoContext) {
  const area = deliveryArea(ctx);

  return {
    title: category.label,
    description: truncateForMeta(
      category.description.trim() ||
        sentences(
          `Shop ${category.label.toLowerCase()} at ${ctx.siteName}`,
          area && `Delivery across ${area}`
        )
    ),
  };
}

export function subcategoryMetaFallback(
  subcategory: { label: string },
  category: CategoryLike,
  ctx: SeoContext
) {
  const area = deliveryArea(ctx);
  const sub = subcategory.label;

  return {
    title: `${sub} — ${category.label}`,
    description: truncateForMeta(
      sentences(
        `Shop ${sub.toLowerCase()} at ${ctx.siteName}`,
        `Part of our ${category.label.toLowerCase()} range`,
        area && `Delivery across ${area}`
      )
    ),
  };
}
