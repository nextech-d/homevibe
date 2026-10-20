import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  RefreshCw,
  Search,
  Pencil,
  Trash2,
  ExternalLink,
  Newspaper,
  BookOpen,
} from "lucide-react";
import { api, STORE_URL } from "../lib/api";
import {
  CatalogStatTile,
  StorefrontSection,
  storefrontInputClass,
  storefrontSelectClass,
} from "../components/StorefrontPanel";
import type { ContentPostType } from "../components/ContentPostForm";

type ContentPost = {
  id: number;
  type: ContentPostType;
  slug: string;
  title: string;
  excerpt: string;
  isPublished: boolean;
  publishedAt: string | null;
  updatedAt: string;
};

type Summary = {
  total: number;
  filtered: number;
  published: number;
  drafts: number;
};

const CONFIG: Record<
  ContentPostType,
  {
    title: string;
    description: string;
    icon: typeof Newspaper;
    basePath: string;
    storefrontPath: string;
    newPath: string;
  }
> = {
  blog: {
    title: "Blog posts",
    description: "News, tips, and dated updates — published at /blog on the storefront.",
    icon: Newspaper,
    basePath: "/content/blog",
    storefrontPath: "/blog",
    newPath: "/content/blog/new",
  },
  article: {
    title: "Articles",
    description: "Evergreen guides and buying advice — published at /blog on the storefront, alongside blog posts.",
    icon: BookOpen,
    basePath: "/content/articles",
    storefrontPath: "/blog",
    newPath: "/content/articles/new",
  },
};

export default function ContentPostsPage({ type }: { type: ContentPostType }) {
  const config = CONFIG[type];
  const Icon = config.icon;

  const [posts, setPosts] = useState<ContentPost[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [publishedFilter, setPublishedFilter] = useState<"" | "true" | "false">("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams({ type });
    if (q.trim()) params.set("q", q.trim());
    if (publishedFilter) params.set("published", publishedFilter);
    return params.toString();
  }, [type, q, publishedFilter]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api<{ posts: ContentPost[]; summary: Summary }>(
        `/admin/content/posts?${queryString}`
      );
      setPosts(data.posts);
      setSummary(data.summary);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load posts");
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    const timer = setTimeout(load, q ? 300 : 0);
    return () => clearTimeout(timer);
  }, [load, q]);

  async function deletePost(id: number) {
    if (!confirm("Delete this post? This cannot be undone.")) return;
    setDeletingId(id);
    setError("");
    try {
      await api(`/admin/content/posts/${id}`, { method: "DELETE" });
      setPosts((prev) => prev.filter((post) => post.id !== id));
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete post");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-white">{config.title}</h1>
          <p className="mt-1 text-sm text-neutral-500">{config.description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-[#333] bg-[#111] px-3 py-2 text-xs font-medium text-neutral-300 hover:bg-[#1a1a1a] disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <Link
            to={config.newPath}
            className="inline-flex items-center gap-2 rounded-lg bg-[#00e599] px-3 py-2 text-xs font-semibold text-black hover:bg-[#00cc88]"
          >
            <Plus className="h-3.5 w-3.5" />
            New {type === "blog" ? "post" : "article"}
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="space-y-6">
        <StorefrontSection title="Overview" icon={Icon} accent="green">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <CatalogStatTile label="Total" value={summary?.total ?? 0} icon={Icon} accent="green" />
            <CatalogStatTile
              label="Published"
              value={summary?.published ?? 0}
              icon={Icon}
              accent="sky"
            />
            <CatalogStatTile
              label="Drafts"
              value={summary?.drafts ?? 0}
              icon={Icon}
              accent="amber"
              valueClassName={(summary?.drafts ?? 0) > 0 ? "text-amber-400" : "text-white"}
            />
            <CatalogStatTile
              label="Shown"
              value={summary?.filtered ?? 0}
              icon={Search}
              accent="violet"
            />
          </div>
        </StorefrontSection>

        <StorefrontSection title="Filter" icon={Search} accent="sky">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-neutral-500">Search</label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-600" />
                <input
                  type="search"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Title or slug…"
                  className={`${storefrontInputClass} pl-9`}
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-neutral-500">Status</label>
              <select
                value={publishedFilter}
                onChange={(e) => setPublishedFilter(e.target.value as "" | "true" | "false")}
                className={storefrontSelectClass}
              >
                <option value="">All</option>
                <option value="true">Published</option>
                <option value="false">Drafts</option>
              </select>
            </div>
          </div>
        </StorefrontSection>

        <StorefrontSection
          title="Posts"
          description={`${summary?.filtered ?? 0} shown`}
          icon={Icon}
          accent="violet"
        >
          {loading && posts.length === 0 ? (
            <p className="text-sm text-neutral-500">Loading…</p>
          ) : posts.length === 0 ? (
            <p className="text-sm text-neutral-500">No posts yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#2a2a2a] text-[10px] uppercase tracking-widest text-neutral-600">
                    <th className="pb-2 pr-4 font-semibold">Title</th>
                    <th className="pb-2 pr-4 font-semibold">Status</th>
                    <th className="pb-2 pr-4 font-semibold">Updated</th>
                    <th className="pb-2 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222]">
                  {posts.map((post) => (
                    <tr key={post.id} className="text-neutral-300">
                      <td className="py-3 pr-4">
                        <Link
                          to={`${config.basePath}/${post.id}/edit`}
                          className="font-medium text-white hover:text-[#00e599]"
                        >
                          {post.title}
                        </Link>
                        <p className="mt-0.5 font-mono text-[10px] text-neutral-600">{post.slug}</p>
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            post.isPublished
                              ? "bg-[#00e599]/10 text-[#00e599]"
                              : "bg-amber-500/10 text-amber-400"
                          }`}
                        >
                          {post.isPublished ? "Published" : "Draft"}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-neutral-500">
                        {new Date(post.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          {post.isPublished && (
                            <a
                              href={`${STORE_URL}${config.storefrontPath}/${post.slug}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-neutral-500 hover:text-white"
                              title="View on storefront"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                          <Link
                            to={`${config.basePath}/${post.id}/edit`}
                            className="text-neutral-500 hover:text-white"
                            title="Edit"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => deletePost(post.id)}
                            disabled={deletingId === post.id}
                            className="text-red-400/70 hover:text-red-400 disabled:opacity-50"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </StorefrontSection>
      </div>
    </div>
  );
}
