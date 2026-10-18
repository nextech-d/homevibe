import type { Metadata } from "next";
import { SITE } from "../config/site";

import { absoluteUrl, getSiteUrl } from "./site-url";

// Re-exported so the many callers that reach for these through seo.ts keep
// working; they live in site-url.ts to stay out of the client bundle's way.
export { absoluteUrl, getSiteUrl };

type PageMetadataInput = {
  title: string;
  description: string;
  path?: string;
  image?: string;
  noIndex?: boolean;
  siteName?: string;
  defaultOgImage?: string;
  /**
   * Next's Metadata API types a fixed set of OpenGraph types and "product" is
   * not among them. Passing it leaves og:type out of the metadata so the page
   * can render the tag itself - see components/ProductOpenGraph - without a
   * second, conflicting og:type being emitted here.
   */
  ogType?: "website" | "product";
};

/** Homepage copy, used when the admin's SEO fields are empty. */
export const HOMEPAGE_TITLE_SUFFIX = "Washers, Fridges & TVs, Free Delivery in Nairobi";
export const HOMEPAGE_DESCRIPTION =
  "Hisense, TCL, Ramtons and Von washers, fridges, TVs and microwaves. Free same-day delivery in Nairobi, 24 hours elsewhere in Kenya, our own technicians, M-Pesa.";

/** The site-wide share image, used when the admin hasn't set one. */
export const DEFAULT_OG_IMAGE = { path: "/og-home.jpg", width: 1200, height: 630 } as const;

/**
 * Product photos are square, at 600px. The built-in share image is 1200x630.
 * An admin-set default could be any size, so it goes out without dimensions
 * rather than with wrong ones.
 */
function ogImageSize(input: PageMetadataInput): { width: number; height: number } | Record<string, never> {
  if (input.image) return { width: 600, height: 600 };
  if (input.defaultOgImage === absoluteUrl(DEFAULT_OG_IMAGE.path)) {
    return { width: DEFAULT_OG_IMAGE.width, height: DEFAULT_OG_IMAGE.height };
  }
  return {};
}

export function buildPageMetadata(input: PageMetadataInput): Metadata {
  const siteName = input.siteName ?? SITE.name;
  const title = input.title.includes(siteName)
    ? input.title
    : `${input.title} | ${siteName}`;
  const canonical = input.path ? absoluteUrl(input.path) : getSiteUrl();
  const imageUrl = input.image ?? input.defaultOgImage;
  const ogImage = imageUrl
    ? [{ url: imageUrl, ...ogImageSize(input), alt: input.title }]
    : undefined;

  return {
    // `absolute` stops the root layout's "%s | siteName" template appending the
    // site name a second time — the title above already carries it.
    title: { absolute: title },
    description: input.description,
    alternates: { canonical },
    ...(input.noIndex && {
      robots: { index: false, follow: false },
    }),
    openGraph: {
      title,
      description: input.description,
      url: canonical,
      siteName,
      locale: "en_KE",
      ...(input.ogType !== "product" && { type: "website" as const }),
      ...(ogImage && { images: ogImage }),
    },
    twitter: {
      card: imageUrl ? "summary_large_image" : "summary",
      title,
      description: input.description,
      ...(imageUrl && { images: [imageUrl] }),
    },
  };
}

const siteIconMetadata: Pick<Metadata, "icons"> = {
  icons: {
    icon: [{ url: "/logo.png", type: "image/png" }],
    apple: [{ url: "/logo.png", type: "image/png" }],
  },
};

export const rootMetadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  ...buildPageMetadata({
    title: `${SITE.name} | ${HOMEPAGE_TITLE_SUFFIX}`,
    description: HOMEPAGE_DESCRIPTION,
    path: "/",
    defaultOgImage: absoluteUrl(DEFAULT_OG_IMAGE.path),
  }),
  ...siteIconMetadata,
  authors: [{ name: SITE.name }],
  creator: SITE.name,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

export async function buildRootMetadataFromContext(): Promise<Metadata> {
  const { getSeoContext } = await import("./seo.server");
  const ctx = await getSeoContext();

  const metadata: Metadata = {
    metadataBase: new URL(getSiteUrl()),
    ...buildPageMetadata({
      title: ctx.homepageTitle,
      description: ctx.homepageDescription,
      path: "/",
      siteName: ctx.siteName,
      defaultOgImage: ctx.defaultOgImage,
    }),
    ...siteIconMetadata,
    title: {
      default: ctx.homepageTitle,
      template: `%s | ${ctx.siteName}`,
    },
    authors: [{ name: ctx.siteName }],
    creator: ctx.siteName,
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
  };

  if (ctx.googleSiteVerification) {
    metadata.verification = { google: ctx.googleSiteVerification };
  }

  return metadata;
}

export const noIndexMetadata: Metadata = {
  robots: { index: false, follow: false },
};
