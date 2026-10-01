import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { ContentPostType } from "@prisma/client";
import {
  contentPostPath,
  getPublishedPostBySlug,
} from "../lib/content.server";
import { buildPageMetadata, absoluteUrl } from "../lib/seo";
import { formatContentDate, renderMarkdown } from "../lib/markdown";
import { serializeJsonLd } from "../lib/json-ld";

type Props = {
  type: ContentPostType;
  params: Promise<{ slug: string }>;
  listLabel: string;
};

export async function generateContentPostMetadata({
  type,
  params,
  listLabel,
}: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(type, slug);
  if (!post) {
    return buildPageMetadata({
      title: "Post Not Found",
      description: "This page could not be found.",
      noIndex: true,
    });
  }

  const fallbackDescription =
    post.metaDescription?.trim() ||
    post.excerpt.trim() ||
    `${post.title} — ${listLabel} from HomeVibe.`;

  return buildPageMetadata({
    title: post.metaTitle?.trim() || post.title,
    description: fallbackDescription,
    path: contentPostPath(type, slug),
    image: post.ogImageUrl ?? undefined,
  });
}

export default async function ContentPostDetail({
  type,
  params,
  listLabel,
  listHref,
}: Props & { listHref: string }) {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(type, slug);
  if (!post) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": type === "blog" ? "BlogPosting" : "Article",
    headline: post.title,
    description: post.metaDescription?.trim() || post.excerpt || post.title,
    datePublished: post.publishedAt ?? undefined,
    dateModified: post.updatedAt,
    author: post.author
      ? { "@type": "Person", name: post.author }
      : { "@type": "Organization", name: "HomeVibe" },
    url: absoluteUrl(contentPostPath(type, slug)),
    ...(post.ogImageUrl ? { image: [post.ogImageUrl] } : {}),
  };

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />
      <article className="mx-auto max-w-3xl px-6 py-12">
        <nav className="mb-8 text-sm text-neutral-500">
          <Link href="/" className="hover:text-neutral-900">
            Home
          </Link>
          <span className="mx-2">/</span>
          <Link href={listHref} className="hover:text-neutral-900">
            {listLabel}
          </Link>
        </nav>

        <header className="mb-10 border-b border-neutral-200 pb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-600">{listLabel}</p>
          <h1 className="mt-3 text-4xl font-light tracking-tight text-neutral-900">{post.title}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-neutral-500">
            {post.publishedAt && (
              <time dateTime={post.publishedAt}>{formatContentDate(post.publishedAt)}</time>
            )}
            {post.author && (
              <>
                <span aria-hidden>·</span>
                <span>{post.author}</span>
              </>
            )}
          </div>
          {post.excerpt && (
            <p className="mt-4 text-lg leading-relaxed text-neutral-600">{post.excerpt}</p>
          )}
        </header>

        <div
          className="prose-content max-w-none"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(post.body) }}
        />

        <footer className="mt-12 border-t border-neutral-200 pt-8">
          <Link href={listHref} className="text-sm font-semibold text-emerald-600 hover:underline">
            ← All {listLabel.toLowerCase()}
          </Link>
        </footer>
      </article>
    </div>
  );
}
