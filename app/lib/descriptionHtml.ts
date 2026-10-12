import "server-only";

import sanitizeHtml from "sanitize-html";
import { parseFragment, serialize } from "parse5";
import { sanitizeDescription } from "../../shared/description-sanitize";

export function descriptionLooksLikeHtml(value: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

export function plainTextToDescriptionHtml(value: string): string {
  return value
    .split("\n")
    .map((line) => `<p>${line.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") || "<br>"}</p>`)
    .join("");
}

/**
 * A product description, safe to render as HTML - on the server, every time.
 *
 * This used to run only in the browser (it needed DOMParser), so the
 * server-rendered page carried the description exactly as stored. Now it's
 * sanitize-html with the shared allowlist (shared/description-sanitize.ts,
 * the same rules the API applies on save), after parse5 has put the markup
 * into the shape a browser would, and the result matches what the old
 * browser-side pass produced for every live description.
 *
 * Server-only: the product page sanitises before handing the description to
 * its client component, so neither library ships to the browser.
 */
export function sanitizeDescriptionHtml(dirty: string): string {
  return sanitizeDescription(dirty, {
    sanitizeHtml,
    reparse: (html) => serialize(parseFragment(html)),
  });
}
