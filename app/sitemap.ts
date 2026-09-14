import type { MetadataRoute } from "next";
import { categoryHref } from "./data/categories";
import { listBrandsForSitemap } from "./lib/brands.server";
import { getAllCategories } from "./lib/categories.server";
import { getInventory } from "./lib/inventory.server";
import { productHref } from "./data/products";
import { getSiteUrl } from "./lib/seo";
import { contentPostPath, listAllPublishedPostsForSitemap } from "./lib/content.server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const now = new Date();
  const [products, categoriesList, brandsList] = await Promise.all([
    getInventory(),
    getAllCategories(),
    listBrandsForSitemap(),
  ]);

  const home: MetadataRoute.Sitemap = [
    {
      url: base,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${base}/track-order`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  const categories: MetadataRoute.Sitemap = categoriesList.flatMap((category) => {
    const entries: MetadataRoute.Sitemap = [
      {
        url: `${base}${categoryHref(category.slug)}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.8,
      },
    ];
    for (const sub of category.subcategories) {
      entries.push({
        url: `${base}${categoryHref(category.slug, sub.slug)}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
    return entries;
  });

  const brands: MetadataRoute.Sitemap = brandsList.map((brand) => ({
    url: `${base}/brand/${brand.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const productPages: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${base}${productHref(product)}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const contentPosts = await listAllPublishedPostsForSitemap();
  const contentPages: MetadataRoute.Sitemap = [
    {
      url: `${base}/blog`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${base}/articles`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    ...contentPosts.map((post) => ({
      url: `${base}${contentPostPath(post.type, post.slug)}`,
      lastModified: post.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.55,
    })),
  ];

  return [...home, ...categories, ...brands, ...productPages, ...contentPages];
}
