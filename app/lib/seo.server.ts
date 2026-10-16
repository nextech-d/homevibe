import "server-only";

import { cache } from "react";

import { SITE } from "../config/site";
import { getPrisma } from "./db";
import { DEFAULT_OG_IMAGE, HOMEPAGE_DESCRIPTION, HOMEPAGE_TITLE_SUFFIX } from "./seo";
import { absoluteUrl } from "./site-url";
import { getSiteSettingsData, type SiteSettingsData } from "./storefront.server";

export type SeoSettingsData = {
  homepageTitle: string;
  homepageDescription: string;
  defaultOgImageUrl: string;
  googleSiteVerification: string;
};

const DEFAULT_SEO: SeoSettingsData = {
  homepageTitle: "",
  homepageDescription: "",
  defaultOgImageUrl: "",
  googleSiteVerification: "",
};

const SEO_KEYS = [
  "homepage_title",
  "homepage_description",
  "default_og_image_url",
  "google_site_verification",
] as const;

function mapSeoSettings(rows: { key: string; value: string }[]): SeoSettingsData {
  const byKey = new Map(rows.map((row) => [row.key, row.value]));
  return {
    homepageTitle: byKey.get("homepage_title") ?? "",
    homepageDescription: byKey.get("homepage_description") ?? "",
    defaultOgImageUrl: byKey.get("default_og_image_url") ?? "",
    googleSiteVerification: byKey.get("google_site_verification") ?? "",
  };
}

/**
 * Memoised per request, like getSiteSettingsData: the root metadata and the
 * site-wide JSON-LD both ask for it, and ran the same query twice.
 */
export const getSeoSettingsData = cache(async (): Promise<SeoSettingsData> => {
  if (!process.env.DATABASE_URL) return DEFAULT_SEO;

  const prisma = getPrisma();
  if (!prisma) return DEFAULT_SEO;

  try {
    const rows = await prisma.siteSetting.findMany({
      where: { key: { in: [...SEO_KEYS] } },
    });
    if (rows.length === 0) return DEFAULT_SEO;
    return mapSeoSettings(rows);
  } catch (error) {
    console.error("Failed to load SEO settings:", error);
    return DEFAULT_SEO;
  }
});

export type SeoContext = {
  site: SiteSettingsData;
  seo: SeoSettingsData;
  siteName: string;
  homepageTitle: string;
  homepageDescription: string;
  defaultOgImage: string | undefined;
  googleSiteVerification: string | undefined;
};

export async function getSeoContext(): Promise<SeoContext> {
  const [site, seo] = await Promise.all([getSiteSettingsData(), getSeoSettingsData()]);
  const siteName = site.name.trim() || SITE.name;

  const homepageTitle = seo.homepageTitle.trim() || `${siteName} | ${HOMEPAGE_TITLE_SUFFIX}`;
  const homepageDescription = seo.homepageDescription.trim() || HOMEPAGE_DESCRIPTION;
  const defaultOgImage = seo.defaultOgImageUrl.trim() || absoluteUrl(DEFAULT_OG_IMAGE.path);
  const googleSiteVerification = seo.googleSiteVerification.trim() || undefined;

  return {
    site,
    seo,
    siteName,
    homepageTitle,
    homepageDescription,
    defaultOgImage,
    googleSiteVerification,
  };
}
