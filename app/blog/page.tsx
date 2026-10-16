import type { Metadata } from "next";
import ContentPostList from "../components/ContentPostList";
import { buildPageMetadata } from "../lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Blog",
  description:
    "News, tips, and updates from HomeVibe — kitchen and gym gear in Nairobi and across Kenya.",
  path: "/blog",
});

export default function BlogIndexPage() {
  return (
    <ContentPostList
      type="blog"
      title="Blog"
      description="News, arrivals, and practical tips for outfitting your kitchen and home gym."
    />
  );
}
