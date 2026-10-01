/**
 * JSON-LD payload as a script-safe string.
 *
 * `<` is escaped so a stray tag in admin-entered copy - a product name or
 * description - cannot close the script element and inject markup. Per Next's
 * JSON-LD guide, JSON.stringify alone does not make a payload safe to embed.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
