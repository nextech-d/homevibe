import Link from "next/link";
import Breadcrumbs from "./Breadcrumbs";
import { pageHeading, raisedSurface, textLink } from "./homeSurfaces";
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
    <div className="min-h-screen pb-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />
      <div className="mx-auto max-w-7xl px-6 py-8">
        <Breadcrumbs
          className="mb-6"
          items={[
            { label: "Home", href: "/" },
            { label: listLabel, href: listHref },
            { label: post.title },
          ]}
        />
        <article className={`${raisedSurface} px-5 py-8 sm:px-10 sm:py-12`}>
          <header className="mb-8 border-b border-[#DCE0E7] pb-8">
            <p className="text-sm font-semibold text-[#8f4710]">{listLabel}</p>
            <h1 className={`mt-2 ${pageHeading}`}>{post.title}</h1>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-neutral-600">
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

          {/* Styled by the classes renderMarkdown puts on each element. */}
          <div
            className="max-w-none [&>:first-child]:mt-0"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(post.body) }}
          />

          <footer className="mt-12 border-t border-[#DCE0E7] pt-6">
            <Link href={listHref} className={`inline-flex min-h-11 items-center text-sm ${textLink}`}>
              ← All {listLabel.toLowerCase()}
            </Link>
          </footer>
        </article>
      </div>
    </div>
  );
}
