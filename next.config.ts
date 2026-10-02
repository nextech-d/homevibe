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

const nextConfig: NextConfig = {
  serverExternalPackages: ["pg"],
  /**
   * Cooking became Kitchen, and Refrigeration, Coffee and Cleaning's dishwashers
   * moved under it. These are the URLs that move with them - permanent, so the
   * ranking they have earned transfers rather than 404ing.
   */
  async redirects() {
    return [
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
