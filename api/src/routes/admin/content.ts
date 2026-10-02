import { Hono } from "hono";
import type { ContentPostType } from "@prisma/client";
import {
  createContentPost,
  deleteContentPost,
  getContentPostById,
  listContentPosts,
  updateContentPost,
} from "../../lib/content.js";
import { scheduleStorefrontPublish } from "../../lib/publishStorefront.js";

export const adminContentRoute = new Hono();

function parseType(value: string | undefined): ContentPostType | null {
  if (value === "blog" || value === "article") return value;
  return null;
}

adminContentRoute.get("/posts", async (c) => {
  const type = parseType(c.req.query("type"));
  if (!type) {
    return c.json({ success: false, message: "Query param type=blog|article is required." }, 400);
  }

  const q = c.req.query("q") ?? undefined;
  const publishedParam = c.req.query("published");
  const published =
    publishedParam === "true" ? true : publishedParam === "false" ? false : undefined;

  try {
    const result = await listContentPosts({ type, q, published });
    return c.json({ success: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load posts.";
    return c.json({ success: false, message }, 503);
  }
});

adminContentRoute.get("/posts/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isFinite(id)) {
    return c.json({ success: false, message: "Invalid post id." }, 400);
  }

  const post = await getContentPostById(id);
  if (!post) return c.json({ success: false, message: "Post not found." }, 404);
  return c.json({ success: true, post });
});

adminContentRoute.post("/posts", async (c) => {
  const body = (await c.req.json()) as Record<string, unknown>;
  const type = parseType(typeof body.type === "string" ? body.type : undefined);
  if (!type) {
    return c.json({ success: false, message: "type must be blog or article." }, 400);
  }
  if (typeof body.title !== "string" || typeof body.body !== "string") {
    return c.json({ success: false, message: "Title and body are required." }, 400);
  }

  try {
    const post = await createContentPost({
      type,
      title: body.title,
      slug: typeof body.slug === "string" ? body.slug : undefined,
      excerpt: typeof body.excerpt === "string" ? body.excerpt : undefined,
      body: body.body,
      metaTitle: typeof body.metaTitle === "string" ? body.metaTitle : null,
      metaDescription: typeof body.metaDescription === "string" ? body.metaDescription : null,
      ogImageUrl: typeof body.ogImageUrl === "string" ? body.ogImageUrl : null,
      author: typeof body.author === "string" ? body.author : null,
      isPublished: typeof body.isPublished === "boolean" ? body.isPublished : undefined,
      publishedAt: typeof body.publishedAt === "string" ? body.publishedAt : null,
    });
    scheduleStorefrontPublish("content post");
    return c.json({ success: true, post });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create post.";
    return c.json({ success: false, message }, 400);
  }
});

adminContentRoute.patch("/posts/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isFinite(id)) {
    return c.json({ success: false, message: "Invalid post id." }, 400);
  }

  const body = (await c.req.json()) as Record<string, unknown>;
  try {
    const post = await updateContentPost(id, {
      title: typeof body.title === "string" ? body.title : undefined,
      slug: typeof body.slug === "string" ? body.slug : undefined,
      excerpt: typeof body.excerpt === "string" ? body.excerpt : undefined,
      body: typeof body.body === "string" ? body.body : undefined,
      metaTitle: body.metaTitle === null || typeof body.metaTitle === "string" ? body.metaTitle : undefined,
      metaDescription:
        body.metaDescription === null || typeof body.metaDescription === "string"
          ? body.metaDescription
          : undefined,
      ogImageUrl:
        body.ogImageUrl === null || typeof body.ogImageUrl === "string"
          ? body.ogImageUrl
          : undefined,
      author: body.author === null || typeof body.author === "string" ? body.author : undefined,
      isPublished: typeof body.isPublished === "boolean" ? body.isPublished : undefined,
      publishedAt:
        body.publishedAt === null || typeof body.publishedAt === "string"
          ? body.publishedAt
          : undefined,
    });
    if (!post) return c.json({ success: false, message: "Post not found." }, 404);
    scheduleStorefrontPublish("content post");
    return c.json({ success: true, post });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update post.";
    return c.json({ success: false, message }, 400);
  }
});

adminContentRoute.delete("/posts/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isFinite(id)) {
    return c.json({ success: false, message: "Invalid post id." }, 400);
  }

  try {
    const deleted = await deleteContentPost(id);
    if (!deleted) return c.json({ success: false, message: "Post not found." }, 404);
    scheduleStorefrontPublish("content post");
    return c.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete post.";
    return c.json({ success: false, message }, 400);
  }
});
