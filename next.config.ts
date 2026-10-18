import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";
import { assertNotProductionDatabase } from "./shared/prod-db-guard";

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
 * doesn't govern. The one image that skips the optimiser is a Google review
 * author's avatar (GoogleReviews.tsx, unoptimized), served from
 * lh3.googleusercontent.com.
 *
 * With a Meta Pixel ID set, the pixel adds its library and config scripts
 * (connect.facebook.net) and its event beacons to www.facebook.com: by fetch
 * and by image, and - for an event too long for an image URL, such as a
 * ViewContent with its product details - by a form posted into a hidden
 * iframe, hence form-action and frame-src. Without an ID none of it is
 * allowed.
 *
 * Violations are reported to /api/csp-report, which logs them: report-uri
 * for browsers that only know that, report-to (with the Reporting-Endpoints
 * header below) for the rest.
 *
 * 'unsafe-inline' for scripts because pages are statically cached: a
 * per-request nonce can't be baked into them. 'unsafe-eval' only in
 * development, for Next's hot reload.
 */
const CSP_REPORT_PATH = "/api/csp-report";

function contentSecurityPolicy(): string {
  const dev = process.env.NODE_ENV === "development";
  const api = apiOrigin();
  const pixel = Boolean(process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim());
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""}${pixel ? " https://connect.facebook.net" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: https://lh3.googleusercontent.com${pixel ? " https://www.facebook.com" : ""}`,
    "font-src 'self' data:",
    `connect-src 'self'${api ? ` ${api}` : ""}${pixel ? " https://www.facebook.com https://connect.facebook.net" : ""}${dev ? " ws: wss:" : ""}`,
    `frame-src ${pixel ? "https://www.facebook.com" : "'none'"}`,
    "object-src 'none'",
    "base-uri 'self'",
    `form-action 'self'${pixel ? " https://www.facebook.com" : ""}`,
    "frame-ancestors 'none'",
    `report-uri ${CSP_REPORT_PATH}`,
    "report-to csp-endpoint",
  ].join("; ");
}

/** On every response. */
const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "Content-Security-Policy", value: contentSecurityPolicy() },
  { key: "Reporting-Endpoints", value: `csp-endpoint="${CSP_REPORT_PATH}"` },
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
      // The Von VMS-206MMK microwave was in the catalogue twice. The kept row
      // has the slug that names it; this one named a Ramtons RM/682 and is
      // now unpublished.
      {
        source: "/product/20l-microwave-grill-rm-682-mirror-finish-700w-microwave-and-1000w-grill",
        destination: "/product/von-vms-206mmk-solo-microwave-oven-20l",
        permanent: true,
      },
      // The Ramtons RM/589 was renamed from a slug that said 700W and 8 auto
      // menus; it is 800W with 7.
      {
        source: "/product/23-litre-digital-microwave-grill-in-silver-1000w-grill-700w-microwave-and-8-auto-menus-rm-589",
        destination: "/product/ramtons-rm-589-23l-microwave-grill",
        permanent: true,
      },
      // The Von VRT-125DRAG was renamed from a slug that read like a 125-litre
      // freezer; it's a fridge with a 33L freezer on top.
      {
        source: "/product/von-vrt-125drag-top-mount-freezer-125l",
        destination: "/product/von-vrt-125drag-125l-double-door-fridge",
        permanent: true,
      },
      // The Hisense HB25MOBX7 was in the catalogue twice. It's a 25-litre
      // model; this is the URL of the duplicate that called it 20L, now
      // unpublished.
      {
        source: "/product/hisense-hb25mobx7-built-in-microwave-solo-20l",
        destination: "/product/hisense-hb25mobx7-built-in-microwave-solo-25l",
        permanent: true,
      },
      // The Hisense 43Q6QKEN's name was a sentence from its meta description,
      // and its slug came from that; it now follows the 50" and 55" Q6QKEN.
      {
        source:
          "/product/shop-the-hisense-43q6qken-43-inch-qled-4k-smart-tv-in-kenya-features-dolby-vision-hdr10-vidaa-os-dolby-atmos-and-frameless-design-vivid-4k-qled-picture",
        destination: "/product/hisense-43q6qken-43-inch-qled-4k-smart-frameless-tv",
        permanent: true,
      },
    ];
  },
  images: {
    // 75 stays the default; 90 is for the homepage hero's photos, which ask for it.
    qualities: [75, 90],
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

/** `next dev` never runs against production's database unless ALLOW_PROD_DB=1. */
export default function config(phase: string): NextConfig {
  if (phase === PHASE_DEVELOPMENT_SERVER) assertNotProductionDatabase("the dev server");
  return nextConfig;
}
