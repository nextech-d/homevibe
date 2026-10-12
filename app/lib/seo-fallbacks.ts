import "server-only";

import type { SeoContext } from "./seo.server";
import { descriptionLooksLikeHtml } from "./descriptionHtml";

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

/** One block of a description - a paragraph, a list item, or a heading. */
type RichBlock = { text: string; isHeading: boolean };

const HTML_BLOCK_TAGS =
  "div|p|li|ul|ol|blockquote|section|article|table|thead|tbody|tr|td|th|figure|figcaption";

/**
 * A block carries no body text of its own when every word in it is bold. That
 * is how this catalogue writes its sub-headings - the admin's paste converter
 * emits "<div><b>Smart Energy Saving</b></div>", not an <h3> - so bold-only
 * blocks count as headings alongside real ones.
 */
function isBoldOnly(html: string, text: string): boolean {
  if (!text) return false;
  const withoutBold = html.replace(/<(b|strong)\b[^>]*>[\s\S]*?<\/\1>/gi, " ");
  return plainTextForMeta(withoutBold) === "";
}

function htmlBlocks(html: string): RichBlock[] {
  const split = html
    .replace(/<br\s*\/?>/gi, "\n")
    // h1-h6 become bold-only blocks, which isBoldOnly already reads as
    // headings - one rule instead of two.
    .replace(/<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]\s*>/gi, "\n<b>$1</b>\n")
    .replace(new RegExp(`</?(?:${HTML_BLOCK_TAGS})\\b[^>]*>`, "gi"), "\n");

  return split
    .split("\n")
    .map((chunk) => {
      const text = plainTextForMeta(chunk);
      return { text, isHeading: isBoldOnly(chunk, text) };
    })
    .filter((block) => block.text.length > 0);
}

/**
 * Plain-text descriptions are rendered a line per paragraph (see
 * plainTextToDescriptionHtml), so a line is a block here too.
 */
function markdownBlocks(value: string): RichBlock[] {
  return value
    .split(/\r?\n/)
    .map((line) => {
      const trimmed = line.trim();
      const isHeading =
        /^#{1,6}\s+\S/.test(trimmed) ||
        // A line that is nothing but bold, e.g. "**Smart Energy Saving**".
        /^(\*\*|__)(?!\s)[\s\S]+\1$/.test(trimmed);
      return { text: plainTextForMeta(trimmed), isHeading };
    })
    .filter((block) => block.text.length > 0);
}

/**
 * The body prose of a description, headings dropped, so a summary opens on a
 * sentence rather than gluing a sub-heading to one: "Efficient Cooking
 * Performance This microwave delivers..." was the whole problem.
 *
 * Headings are dropped wherever they appear, not just at the top - a short
 * opening paragraph would otherwise run into the next one's heading. A
 * description made only of headings still uses them, since saying something
 * beats saying nothing.
 */
export function bodyTextForMeta(value: string): string {
  const blocks = descriptionLooksLikeHtml(value)
    ? htmlBlocks(value)
    : markdownBlocks(value);

  const body = blocks.filter((block) => !block.isHeading);
  const used = body.length > 0 ? body : blocks;

  return used
    .map((block) => block.text)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Compares the way a reader would: case and spacing are not a difference. */
function sameText(a: string, b: string): boolean {
  const normalize = (value: string) => value.replace(/\s+/g, " ").trim().toLowerCase();
  return normalize(a) === normalize(b);
}

type ProductDescriptionSource = {
  name: string;
  description: string;
  metaDescription?: string | null;
};

/**
 * What a share preview says about a product.
 *
 * A hand-written metaDescription wins - someone chose those words - unless it
 * is just the product name, which is how most of the catalogue's rows are
 * filled and which left every preview repeating the title above it. Then the
 * product's own intro copy is summarised instead. Empty when there is nothing
 * to say, leaving the caller to fall back.
 *
 * The long-form `body` is never used: it opens mid-topic and reads badly as a
 * one-line preview.
 */
export function productSocialDescription(product: ProductDescriptionSource): string {
  const authored = product.metaDescription?.trim() ?? "";
  if (authored && !sameText(authored, product.name)) return authored;

  return truncateForMeta(bodyTextForMeta(product.description ?? ""));
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
