/**
 * Base URL for the standalone HomeVibe API.
 * When unset, the storefront uses embedded Next.js `/api` routes.
 */
export function getApiBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!url) return "";
  return url.replace(/\/$/, "");
}

/** Hono paths like `/products` become `/api/products` on the Next storefront. */
export function apiUrl(path: string): string {
  const base = getApiBaseUrl();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (base) return `${base}${normalized}`;
  return `/api${normalized}`;
}
