import type { ContentPostType } from "@prisma/client";
import { getPrisma } from "./db.js";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export type ContentPostRecord = {
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
  createdAt: string;
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
  createdAt: Date;
  updatedAt: Date;
}): ContentPostRecord {
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
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export type ContentPostSummary = {
  total: number;
  filtered: number;
  published: number;
  drafts: number;
};

export async function listContentPosts(filters: {
  type: ContentPostType;
  q?: string;
  published?: boolean;
}): Promise<{ posts: ContentPostRecord[]; summary: ContentPostSummary }> {
  const prisma = getPrisma();
  if (!prisma) {
    return {
      posts: [],
      summary: { total: 0, filtered: 0, published: 0, drafts: 0 },
    };
  }

  const q = filters.q?.trim();
  const where = {
    type: filters.type,
    ...(filters.published !== undefined ? { isPublished: filters.published } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" as const } },
            { slug: { contains: q, mode: "insensitive" as const } },
            { excerpt: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [posts, total, published, drafts] = await Promise.all([
    prisma.contentPost.findMany({
      where,
      orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
    }),
    prisma.contentPost.count({ where: { type: filters.type } }),
    prisma.contentPost.count({ where: { type: filters.type, isPublished: true } }),
    prisma.contentPost.count({ where: { type: filters.type, isPublished: false } }),
  ]);

  return {
    posts: posts.map(mapPost),
    summary: {
      total,
      filtered: posts.length,
      published,
      drafts,
    },
  };
}

export async function getContentPostById(id: number): Promise<ContentPostRecord | null> {
  const prisma = getPrisma();
  if (!prisma) return null;

  const row = await prisma.contentPost.findUnique({ where: { id } });
  return row ? mapPost(row) : null;
}

export async function getPublishedContentPostBySlug(
  type: ContentPostType,
  slug: string
): Promise<ContentPostRecord | null> {
  const prisma = getPrisma();
  if (!prisma) return null;

  const row = await prisma.contentPost.findFirst({
    where: { type, slug: slug.toLowerCase(), isPublished: true },
  });
  return row ? mapPost(row) : null;
}

export async function listPublishedContentPosts(
  type: ContentPostType
): Promise<ContentPostRecord[]> {
  const prisma = getPrisma();
  if (!prisma) return [];

  const rows = await prisma.contentPost.findMany({
    where: { type, isPublished: true },
    orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
  });
  return rows.map(mapPost);
}

export async function createContentPost(input: {
  type: ContentPostType;
  title: string;
  slug?: string;
  excerpt?: string;
  body: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
  ogImageUrl?: string | null;
  author?: string | null;
  isPublished?: boolean;
  publishedAt?: string | null;
}): Promise<ContentPostRecord> {
  const prisma = getPrisma();
  if (!prisma) throw new Error("Database unavailable");

  const title = input.title.trim();
  const body = input.body.trim();
  if (!title || !body) throw new Error("Title and body are required.");

  const slug = slugify(input.slug || title);
  const isPublished = input.isPublished ?? false;
  const publishedAt =
    isPublished
      ? input.publishedAt
        ? new Date(input.publishedAt)
        : new Date()
      : null;

  const row = await prisma.contentPost.create({
    data: {
      type: input.type,
      slug,
      title,
      excerpt: input.excerpt?.trim() ?? "",
      body,
      metaTitle: input.metaTitle?.trim() || null,
      metaDescription: input.metaDescription?.trim() || null,
      ogImageUrl: input.ogImageUrl?.trim() || null,
      author: input.author?.trim() || null,
      isPublished,
      publishedAt,
    },
  });

  return mapPost(row);
}

export async function updateContentPost(
  id: number,
  input: Partial<{
    title: string;
    slug: string;
    excerpt: string;
    body: string;
    metaTitle: string | null;
    metaDescription: string | null;
    ogImageUrl: string | null;
    author: string | null;
    isPublished: boolean;
    publishedAt: string | null;
  }>
): Promise<ContentPostRecord | null> {
  const prisma = getPrisma();
  if (!prisma) throw new Error("Database unavailable");

  const existing = await prisma.contentPost.findUnique({ where: { id } });
  if (!existing) return null;

  const data: Record<string, unknown> = {};
  if (input.title !== undefined) data.title = input.title.trim();
  if (input.slug !== undefined) data.slug = slugify(input.slug);
  if (input.excerpt !== undefined) data.excerpt = input.excerpt.trim();
  if (input.body !== undefined) data.body = input.body.trim();
  if (input.metaTitle !== undefined) data.metaTitle = input.metaTitle?.trim() || null;
  if (input.metaDescription !== undefined) {
    data.metaDescription = input.metaDescription?.trim() || null;
  }
  if (input.ogImageUrl !== undefined) data.ogImageUrl = input.ogImageUrl?.trim() || null;
  if (input.author !== undefined) data.author = input.author?.trim() || null;

  if (input.isPublished !== undefined) {
    data.isPublished = input.isPublished;
    if (input.isPublished && !existing.publishedAt) {
      data.publishedAt = input.publishedAt ? new Date(input.publishedAt) : new Date();
    }
    if (!input.isPublished) {
      data.publishedAt = null;
    }
  } else if (input.publishedAt !== undefined && input.publishedAt) {
    data.publishedAt = new Date(input.publishedAt);
  }

  const row = await prisma.contentPost.update({ where: { id }, data });
  return mapPost(row);
}

export async function deleteContentPost(id: number): Promise<boolean> {
  const prisma = getPrisma();
  if (!prisma) throw new Error("Database unavailable");

  const result = await prisma.contentPost.deleteMany({ where: { id } });
  return result.count > 0;
}

/** Blog posts and articles are both served under /blog on the storefront. */
export function contentPostPublicPath(slug: string): string {
  return `/blog/${slug}`;
}
