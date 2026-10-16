import Link from "next/link";
import type { ContentPostType } from "@prisma/client";
import {
  contentPostPath,
  listPublishedPosts,
  type ContentPostData,
} from "../lib/content.server";
import { formatContentDate } from "../lib/markdown";
import { focusRing, pageHeading, raisedSurface, textLink } from "./homeSurfaces";

function PostCard({ post }: { post: ContentPostData }) {
  return (
    // One link per card, stretched over it, as the product cards do: the title
    // and "Read more" used to be two tab stops to the same page. The ring goes
    // round the card when that link has keyboard focus.
    <article
      className={`${raisedSurface} group relative p-6 transition-colors hover:border-[#c9ced8] has-[.card-link:focus-visible]:outline-2 has-[.card-link:focus-visible]:outline-offset-2 has-[.card-link:focus-visible]:outline-[#a85414] sm:p-8`}
    >
      <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-600">
        {post.publishedAt && <time dateTime={post.publishedAt}>{formatContentDate(post.publishedAt)}</time>}
        {post.author && (
          <>
            <span aria-hidden>·</span>
            <span>{post.author}</span>
          </>
        )}
      </div>
      <h2 className="mt-2 text-xl font-semibold tracking-tight text-neutral-950 md:text-2xl">
        <Link
          href={contentPostPath(post.type, post.slug)}
          className="card-link after:absolute after:inset-0 group-hover:underline focus-visible:outline-none"
        >
          {post.title}
        </Link>
      </h2>
      {post.excerpt && (
        <p className="mt-3 line-clamp-3 text-base leading-relaxed text-neutral-600">{post.excerpt}</p>
      )}
      <span aria-hidden="true" className="mt-4 inline-flex text-sm font-semibold text-[#8f4710]">
        Read more →
      </span>
    </article>
  );
}

export default async function ContentPostList({
  type,
  title,
  description,
}: {
  type: ContentPostType;
  title: string;
  description: string;
}) {
  const posts = await listPublishedPosts(type);

  return (
    <div className="min-h-screen pb-24">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <header className="mb-8">
          <p className="text-sm font-medium text-neutral-600">HomeVibe</p>
          <h1 className={`mt-1 ${pageHeading}`}>{title}</h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-neutral-600">{description}</p>
        </header>

        {posts.length === 0 ? (
          <div className={`${raisedSurface} px-6 py-16 text-center`}>
            <p className="text-base text-neutral-700">No published posts yet. Check back soon.</p>
            <Link href="/" className={`mt-4 inline-flex min-h-11 items-center text-sm ${textLink}`}>
              Back to home
            </Link>
          </div>
        ) : (
          <div className="grid gap-5">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}

        <div className="mt-10 flex items-center justify-center gap-3 text-sm">
          <Link
            href="/"
            className={`inline-flex min-h-11 items-center rounded-sm font-medium text-neutral-700 hover:text-neutral-950 hover:underline ${focusRing}`}
          >
            ← Home
          </Link>
          <span aria-hidden="true" className="text-neutral-500">|</span>
          {type === "blog" ? (
            <Link href="/articles" className={`inline-flex min-h-11 items-center ${textLink}`}>
              Guides & articles
            </Link>
          ) : (
            <Link href="/blog" className={`inline-flex min-h-11 items-center ${textLink}`}>
              Blog
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
