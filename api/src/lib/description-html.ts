import sanitizeHtml from "sanitize-html";
import { parseFragment, serialize } from "parse5";
import { sanitizeDescription } from "../../../shared/description-sanitize.js";

/** Same test the storefront uses: plain-text descriptions stay plain text. */
export function descriptionLooksLikeHtml(value: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

/**
 * Sanitises a product description before it is saved, with the same
 * allowlist the storefront applies when it renders one
 * (shared/description-sanitize.ts). What's stored is already clean, and the
 * storefront's pass is a second line of defence rather than the only one.
 */
export function sanitizeDescriptionForSave(description: string): string {
  if (!descriptionLooksLikeHtml(description)) return description;
  return sanitizeDescription(description, {
    sanitizeHtml,
    reparse: (html) => serialize(parseFragment(html)),
  });
}
