import type { NextConfig } from "next";

function assertCheckoutApiUrlForProductionBuild(): void {
  const isProductionBuild =
    process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
  if (!isProductionBuild) return;

  const url = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!url) {
    throw new Error(
      "NEXT_PUBLIC_API_URL is required for production builds. Checkout proxies orders to the standalone API; without it the shop cannot take orders."
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`NEXT_PUBLIC_API_URL is not a valid URL: "${url}"`);
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("NEXT_PUBLIC_API_URL must use http: or https:");
  }
}

assertCheckoutApiUrlForProductionBuild();

/** The API the browser talks to (site settings, catalogue), for connect-src. */
function apiOrigin(): string | null {
  try {
    return new URL(process.env.NEXT_PUBLIC_API_URL ?? "").origin;
  } catch {
    return null;
  }
}

/**
 * Content-Security-Policy, built from what the pages actually load: their
 * own scripts, styles, fonts and /_next/image URLs (remote images all go
 * through the optimiser), Next's inline bootstrap scripts, inline style
 * attributes, and fetches to the API. JSON-LD blocks are data, not script,
 * so they need nothing. wa.me and social links are navigation, which CSP
 * doesn't govern.
 *
 * 'unsafe-inline' for scripts because pages are statically cached: a
 * per-request nonce can't be baked into them. 'unsafe-eval' only in
 * development, for Next's hot reload.
 */
function contentSecurityPolicy(): string {
  const dev = process.env.NODE_ENV === "development";
  const api = apiOrigin();
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    `connect-src 'self'${api ? ` ${api}` : ""}${dev ? " ws: wss:" : ""}`,
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
}

/**
 * On every response. The CSP is report-only for now: browsers log what it
 * would block without blocking it, so it can be checked against real
 * traffic before it enforces.
 */
const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "Content-Security-Policy-Report-Only", value: contentSecurityPolicy() },
];

const nextConfig: NextConfig = {
  // No "X-Powered-By: Next.js" advertising the framework and its version.
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
  serverExternalPackages: ["pg"],
  /**
   * Cooking became Kitchen, and Refrigeration, Coffee and Cleaning's dishwashers
   * moved under it. These are the URLs that move with them - permanent, so the
   * ranking they have earned transfers rather than 404ing.
   */
  async redirects() {
    return [
      // The storefront's own admin is gone; the admin lives at its own
      // address. Old bookmarks land on the same page there - /admin/products
      // becomes admin.homevibe.co.ke/products - and permanent, so nothing
      // keeps asking the storefront for it.
      { source: "/admin", destination: "https://admin.homevibe.co.ke", permanent: true },
      {
        source: "/admin/:path*",
        destination: "https://admin.homevibe.co.ke/:path*",
        permanent: true,
      },
      { source: "/category/cooking", destination: "/category/kitchen", permanent: true },
      { source: "/category/cooking/:sub", destination: "/category/kitchen/:sub", permanent: true },
      { source: "/category/refrigeration", destination: "/category/kitchen", permanent: true },
      { source: "/category/refrigeration/:sub", destination: "/category/kitchen/:sub", permanent: true },
      { source: "/category/coffee-tech", destination: "/category/kitchen", permanent: true },
      { source: "/category/coffee-tech/:sub", destination: "/category/kitchen/:sub", permanent: true },
      {
        source: "/category/cleaning/dishwashers",
        destination: "/category/kitchen/dishwashers",
        permanent: true,
      },
      // The Hisense 50Q6QKEN was in the catalogue twice, at two prices. The
      // kept row now serves the unsuffixed slug; this is the URL the duplicate
      // was sitting on.
      {
        source:
          "/product/hisense-50q6qken-50-inch-qled-4k-uhd-smart-frameless-tv-dolby-vision-dolby-atmos-and-vidaa-os-1",
        destination:
          "/product/hisense-50q6qken-50-inch-qled-4k-uhd-smart-frameless-tv-dolby-vision-dolby-atmos-and-vidaa-os",
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        // Google review author avatars from the Places API.
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.blob.vercel-storage.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
