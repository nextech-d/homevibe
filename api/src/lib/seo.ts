import { getPrisma } from "./db.js";

export type SeoSettings = {
  homepageTitle: string;
  homepageDescription: string;
  defaultOgImageUrl: string;
  googleSiteVerification: string;
};

export const SEO_SETTING_KEYS = [
  "homepage_title",
  "homepage_description",
  "default_og_image_url",
  "google_site_verification",
] as const;

export const DEFAULT_SEO_SETTINGS: SeoSettings = {
  homepageTitle: "",
  homepageDescription: "",
  defaultOgImageUrl: "",
  googleSiteVerification: "",
};

function mapSeoSettings(rows: { key: string; value: string }[]): SeoSettings {
  const byKey = new Map(rows.map((row) => [row.key, row.value]));
  return {
    homepageTitle: byKey.get("homepage_title") ?? "",
    homepageDescription: byKey.get("homepage_description") ?? "",
    defaultOgImageUrl: byKey.get("default_og_image_url") ?? "",
    googleSiteVerification: byKey.get("google_site_verification") ?? "",
  };
}

/**
 * Takes what Search Console actually puts on the clipboard.
 *
 * It hands you the whole `<meta name="google-site-verification" content="..." />`
 * tag, and pasting that in produced a tag whose content attribute was itself an
 * escaped tag - which Google cannot match, so the site silently failed
 * verification. Pull the token out of a pasted tag, and store the rest trimmed.
 */
export function normaliseVerificationToken(value: string): string {
  const decoded = value.trim().replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'");
  if (!decoded) return "";

  const fromTag = decoded.match(/content\s*=\s*["']([^"']+)["']/i);
  return (fromTag ? fromTag[1] : decoded).trim();
}

function seoSettingsToDb(settings: Partial<SeoSettings>): Record<string, string> {
  const map: Record<string, string> = {};
  if (settings.homepageTitle !== undefined) map.homepage_title = settings.homepageTitle;
  if (settings.homepageDescription !== undefined) {
    map.homepage_description = settings.homepageDescription;
  }
  if (settings.defaultOgImageUrl !== undefined) map.default_og_image_url = settings.defaultOgImageUrl;
  if (settings.googleSiteVerification !== undefined) {
    map.google_site_verification = normaliseVerificationToken(settings.googleSiteVerification);
  }
  return map;
}

export async function getSeoSettings(): Promise<SeoSettings> {
  const prisma = getPrisma();
  if (!prisma) return DEFAULT_SEO_SETTINGS;

  const rows = await prisma.siteSetting.findMany({
    where: { key: { in: [...SEO_SETTING_KEYS] } },
  });
  if (rows.length === 0) return DEFAULT_SEO_SETTINGS;
  return mapSeoSettings(rows);
}

export async function updateSeoSettings(partial: Partial<SeoSettings>): Promise<SeoSettings> {
  const prisma = getPrisma();
  if (!prisma) throw new Error("Database unavailable");

  const entries = Object.entries(seoSettingsToDb(partial));
  for (const [key, value] of entries) {
    await prisma.siteSetting.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
  }

  return getSeoSettings();
}

export type SeoOverview = {
  siteUrl: string;
  sitemapUrl: string;
  robotsUrl: string;
  publishedProducts: number;
  productsMissingMeta: number;
  brandsMissingMeta: number;
  categoriesUsingDefaults: number;
  faqCount: number;
  publishedBlogPosts: number;
  publishedArticles: number;
  contentMissingMeta: number;
  hasHomepageTitle: boolean;
  hasHomepageDescription: boolean;
  hasDefaultOgImage: boolean;
  hasGoogleVerification: boolean;
  items: Array<{
    type: "product" | "brand" | "blog" | "article";
    id: number;
    name: string;
    slug?: string;
    missing: ("title" | "description")[];
  }>;
};

export async function getSeoOverview(siteUrl: string): Promise<SeoOverview> {
  const prisma = getPrisma();
  const seo = await getSeoSettings();
  const baseUrl = siteUrl.replace(/\/$/, "");

  if (!prisma) {
    return {
      siteUrl: baseUrl,
      sitemapUrl: `${baseUrl}/sitemap.xml`,
      robotsUrl: `${baseUrl}/robots.txt`,
      publishedProducts: 0,
      productsMissingMeta: 0,
      brandsMissingMeta: 0,
      categoriesUsingDefaults: 0,
      faqCount: 0,
      publishedBlogPosts: 0,
      publishedArticles: 0,
      contentMissingMeta: 0,
      hasHomepageTitle: Boolean(seo.homepageTitle.trim()),
      hasHomepageDescription: Boolean(seo.homepageDescription.trim()),
      hasDefaultOgImage: Boolean(seo.defaultOgImageUrl.trim()),
      hasGoogleVerification: Boolean(seo.googleSiteVerification.trim()),
      items: [],
    };
  }

  const [
    publishedProducts,
    products,
    brands,
    categoryCount,
    faqCount,
    publishedBlogPosts,
    publishedArticles,
    contentPosts,
  ] = await Promise.all([
    prisma.product.count({ where: { isPublished: true } }),
    prisma.product.findMany({
      where: { isPublished: true },
      select: { id: true, name: true, slug: true, metaTitle: true, metaDescription: true },
      orderBy: { id: "asc" },
    }),
    prisma.brand.findMany({
      select: { id: true, name: true, slug: true, metaTitle: true, metaDescription: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.category.count(),
    prisma.faqItem.count(),
    prisma.contentPost.count({ where: { type: "blog", isPublished: true } }),
    prisma.contentPost.count({ where: { type: "article", isPublished: true } }),
    prisma.contentPost.findMany({
      where: { isPublished: true },
      select: {
        id: true,
        type: true,
        title: true,
        slug: true,
        metaTitle: true,
        metaDescription: true,
      },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const productItems = products
    .map((p) => {
      const missing: ("title" | "description")[] = [];
      if (!p.metaTitle?.trim()) missing.push("title");
      if (!p.metaDescription?.trim()) missing.push("description");
      return missing.length > 0
        ? { type: "product" as const, id: p.id, name: p.name, slug: p.slug, missing }
        : null;
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const brandItems = brands
    .map((b) => {
      const missing: ("title" | "description")[] = [];
      if (!b.metaTitle?.trim()) missing.push("title");
      if (!b.metaDescription?.trim()) missing.push("description");
      return missing.length > 0
        ? { type: "brand" as const, id: b.id, name: b.name, slug: b.slug, missing }
        : null;
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const contentItems = contentPosts
    .map((post) => {
      const missing: ("title" | "description")[] = [];
      if (!post.metaTitle?.trim()) missing.push("title");
      if (!post.metaDescription?.trim()) missing.push("description");
      return missing.length > 0
        ? {
            type: post.type as "blog" | "article",
            id: post.id,
            name: post.title,
            slug: post.slug,
            missing,
          }
        : null;
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const items = [...productItems, ...brandItems, ...contentItems].slice(0, 50);

  return {
    siteUrl: baseUrl,
    sitemapUrl: `${baseUrl}/sitemap.xml`,
    robotsUrl: `${baseUrl}/robots.txt`,
    publishedProducts,
    productsMissingMeta: productItems.length,
    brandsMissingMeta: brandItems.length,
    categoriesUsingDefaults: categoryCount,
    faqCount,
    publishedBlogPosts,
    publishedArticles,
    contentMissingMeta: contentItems.length,
    hasHomepageTitle: Boolean(seo.homepageTitle.trim()),
    hasHomepageDescription: Boolean(seo.homepageDescription.trim()),
    hasDefaultOgImage: Boolean(seo.defaultOgImageUrl.trim()),
    hasGoogleVerification: Boolean(seo.googleSiteVerification.trim()),
    items,
  };
}
