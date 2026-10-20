import "server-only";

import type { ContentPostType } from "@prisma/client";
import { getPrisma } from "./db";

export type ContentPostData = {
  id: number;
  type: ContentPostType;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  metaTitle: string | null;
  metaDescription: string | null;
  ogImageUrl: string | null;
  author: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  updatedAt: string;
};

function mapPost(row: {
  id: number;
  type: ContentPostType;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  metaTitle: string | null;
  metaDescription: string | null;
  ogImageUrl: string | null;
  author: string | null;
  isPublished: boolean;
  publishedAt: Date | null;
  updatedAt: Date;
}): ContentPostData {
  return {
    id: row.id,
    type: row.type,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    body: row.body,
    metaTitle: row.metaTitle,
    metaDescription: row.metaDescription,
    ogImageUrl: row.ogImageUrl,
    author: row.author,
    isPublished: row.isPublished,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** Every published post, blog posts and articles alike: they share /blog. */
export async function listPublishedPosts(): Promise<ContentPostData[]> {
  if (!process.env.DATABASE_URL) return [];

  const prisma = getPrisma();
  if (!prisma) return [];

  try {
    const rows = await prisma.contentPost.findMany({
      where: { isPublished: true },
      orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
    });
    return rows.map(mapPost);
  } catch (error) {
    console.error("Failed to load content posts:", error);
    return [];
  }
}

/**
 * A published post of either type. A blog post and an article may share a
 * slug (it is unique per type); the blog post wins, as it did at /blog/<slug>.
 */
export async function getPublishedPostBySlug(slug: string): Promise<ContentPostData | null> {
  if (!process.env.DATABASE_URL) return null;

  const prisma = getPrisma();
  if (!prisma) return null;

  try {
    const row = await prisma.contentPost.findFirst({
      where: { slug: slug.toLowerCase(), isPublished: true },
      orderBy: { type: "asc" },
    });
    return row ? mapPost(row) : null;
  } catch (error) {
    console.error("Failed to load content post:", error);
    return null;
  }
}

export async function listAllPublishedPostsForSitemap(): Promise<
  Array<{ type: ContentPostType; slug: string; updatedAt: Date }>
> {
  if (!process.env.DATABASE_URL) return [];

  const prisma = getPrisma();
  if (!prisma) return [];

  try {
    return await prisma.contentPost.findMany({
      where: { isPublished: true },
      select: { type: true, slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    });
  } catch (error) {
    // Thrown, like the sitemap's products: a partial sitemap reads as pages removed.
    throw new Error("Failed to load content posts for sitemap", { cause: error });
  }
}

/** Blog posts and articles both live under /blog; /articles redirects there. */
export function contentPostPath(slug: string): string {
  return `/blog/${slug}`;
}
