import { Hono } from "hono";
import {
  getSiteSettings,
  listFeaturedSlots,
  listFaqItems,
  seedDefaultSiteSettingsIfEmpty,
} from "../lib/storefront.js";
import { getSeoSettings } from "../lib/seo.js";
import { listPublishedContentPosts, getPublishedContentPostBySlug } from "../lib/content.js";
import { getGoogleReviews } from "../lib/google-reviews.js";

export const storefrontRoute = new Hono();

storefrontRoute.get("/featured", async (c) => {
  try {
    const slots = await listFeaturedSlots();
    return c.json({
      success: true,
      columns: slots.map((slot) => ({
        columnIndex: slot.columnIndex,
        topProductId: slot.topProductId,
        bottomProductId: slot.bottomProductId,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load featured slots.";
    return c.json({ success: false, message }, 503);
  }
});

storefrontRoute.get("/settings", async (c) => {
  try {
    await seedDefaultSiteSettingsIfEmpty();
    const settings = await getSiteSettings();
    return c.json({ success: true, settings });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load site settings.";
    return c.json({ success: false, message }, 503);
  }
});

storefrontRoute.get("/content/:type", async (c) => {
  const typeParam = c.req.param("type");
  if (typeParam !== "blog" && typeParam !== "article") {
    return c.json({ success: false, message: "Invalid content type." }, 400);
  }

  try {
    const posts = await listPublishedContentPosts(typeParam);
    return c.json({
      success: true,
      posts: posts.map((post) => ({
        id: post.id,
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        author: post.author,
        publishedAt: post.publishedAt,
        ogImageUrl: post.ogImageUrl,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load content.";
    return c.json({ success: false, message }, 503);
  }
});

storefrontRoute.get("/content/:type/:slug", async (c) => {
  const typeParam = c.req.param("type");
  if (typeParam !== "blog" && typeParam !== "article") {
    return c.json({ success: false, message: "Invalid content type." }, 400);
  }

  const slug = c.req.param("slug");
  try {
    const post = await getPublishedContentPostBySlug(typeParam, slug);
    if (!post) return c.json({ success: false, message: "Post not found." }, 404);
    return c.json({ success: true, post });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load post.";
    return c.json({ success: false, message }, 503);
  }
});

storefrontRoute.get("/seo", async (c) => {
  try {
    const settings = await getSeoSettings();
    return c.json({ success: true, settings });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load SEO settings.";
    return c.json({ success: false, message }, 503);
  }
});

storefrontRoute.get("/faq", async (c) => {
  try {
    const items = await listFaqItems();
    return c.json({ success: true, items });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load FAQ.";
    return c.json({ success: false, message }, 503);
  }
});

storefrontRoute.get("/reviews", async (c) => {
  try {
    const reviews = await getGoogleReviews();
    return c.json({ success: true, reviews });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load Google reviews.";
    return c.json({ success: false, message }, 503);
  }
});
