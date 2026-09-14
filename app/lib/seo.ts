import type { Metadata } from "next";
import { SITE } from "../config/site";

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

type PageMetadataInput = {
  title: string;
  description: string;
  path?: string;
  image?: string;
  noIndex?: boolean;
  siteName?: string;
  defaultOgImage?: string;
};

export function buildPageMetadata(input: PageMetadataInput): Metadata {
  const siteName = input.siteName ?? SITE.name;
  const title = input.title.includes(siteName)
    ? input.title
    : `${input.title} | ${siteName}`;
  const canonical = input.path ? absoluteUrl(input.path) : getSiteUrl();
  const imageUrl = input.image ?? input.defaultOgImage;
  const ogImage = imageUrl
    ? [{ url: imageUrl, width: 600, height: 600, alt: input.title }]
    : undefined;

  return {
    title,
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
      type: "website",
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

export const siteKeywords = [
  "kitchen appliances",
  "gym equipment",
  "home appliances",
  "Nairobi",
  "Kenya",
  "East Africa",
  "M-Pesa",
  "Sub-Zero",
  "Life Fitness",
  "HomeVibe",
];

export const rootMetadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  ...buildPageMetadata({
    title: `${SITE.name} — Home & Gym Appliances`,
    description: `${SITE.tagline}. Shop kitchen and gym equipment in ${SITE.city} with free delivery, installation help, and M-Pesa across ${SITE.region}.`,
    path: "/",
  }),
  ...siteIconMetadata,
  keywords: siteKeywords,
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
    keywords: siteKeywords,
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
