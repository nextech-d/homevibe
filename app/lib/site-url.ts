/**
 * The site's own URL, and paths made absolute against it.
 *
 * Separate from seo.ts because that module reaches for seo.server.ts, and so
 * for `pg`: anything a client component can touch has to stay clear of it.
 * These two read a NEXT_PUBLIC_ variable and nothing else, so they are safe
 * on either side. seo.ts re-exports them, so existing callers are unaffected.
 */

/** Production site URL — set NEXT_PUBLIC_SITE_URL on Vercel when using a custom domain. */
export function getSiteUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://homevibe.co.ke";
  return url.replace(/\/$/, "");
}

export function absoluteUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${getSiteUrl()}${normalized}`;
}
