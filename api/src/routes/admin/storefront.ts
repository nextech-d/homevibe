import { Hono } from "hono";
import {
  createFaqItem,
  deleteFaqItem,
  getSiteSettings,
  listFeaturedSlots,
  listFaqItems,
  updateFeaturedSlots,
  updateFaqItem,
  updateSiteSettings,
} from "../../lib/storefront.js";
import { listProductsFiltered } from "../../lib/products.js";
import { publishStorefront, scheduleStorefrontPublish } from "../../lib/publishStorefront.js";

export const adminStorefrontRoute = new Hono();

adminStorefrontRoute.post("/publish", async (c) => {
  try {
    const publish = await publishStorefront();
    return c.json({ success: true, publish });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to publish storefront.";
    return c.json({ success: false, message }, 503);
  }
});

adminStorefrontRoute.get("/featured", async (c) => {
  const slots = await listFeaturedSlots();
  const { products } = await listProductsFiltered({ published: true });
  return c.json({ success: true, slots, productOptions: products });
});

adminStorefrontRoute.patch("/featured", async (c) => {
  const body = (await c.req.json()) as { slots?: unknown };
  if (!Array.isArray(body.slots)) {
    return c.json({ success: false, message: "Invalid slots payload." }, 400);
  }

  const slots = body.slots.map((slot) => {
    if (
      typeof slot !== "object" ||
      slot === null ||
      typeof (slot as { columnIndex?: unknown }).columnIndex !== "number" ||
      typeof (slot as { topProductId?: unknown }).topProductId !== "number"
    ) {
      return null;
    }
    const s = slot as { columnIndex: number; topProductId: number; bottomProductId?: unknown };
    return {
      columnIndex: s.columnIndex,
      topProductId: s.topProductId,
      bottomProductId:
        typeof s.bottomProductId === "number" ? s.bottomProductId : null,
    };
  });

  if (slots.some((slot) => slot === null)) {
    return c.json({ success: false, message: "Invalid slot entry." }, 400);
  }

  try {
    const updated = await updateFeaturedSlots(slots as NonNullable<(typeof slots)[number]>[]);
    scheduleStorefrontPublish("storefront settings");
    return c.json({ success: true, slots: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update featured slots.";
    return c.json({ success: false, message }, 400);
  }
});

adminStorefrontRoute.get("/settings", async (c) => {
  try {
    const settings = await getSiteSettings();
    return c.json({ success: true, settings });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load site settings.";
    return c.json({ success: false, message }, 503);
  }
});

adminStorefrontRoute.patch("/settings", async (c) => {
  const body = (await c.req.json()) as Record<string, unknown>;
  try {
    const settings = await updateSiteSettings({
      name: typeof body.name === "string" ? body.name : undefined,
      tagline: typeof body.tagline === "string" ? body.tagline : undefined,
      email: typeof body.email === "string" ? body.email : undefined,
      phone: typeof body.phone === "string" ? body.phone : undefined,
      whatsapp: typeof body.whatsapp === "string" ? body.whatsapp : undefined,
      region: typeof body.region === "string" ? body.region : undefined,
      city: typeof body.city === "string" ? body.city : undefined,
      facebookUrl: typeof body.facebookUrl === "string" ? body.facebookUrl : undefined,
      instagramUrl: typeof body.instagramUrl === "string" ? body.instagramUrl : undefined,
      tiktokUrl: typeof body.tiktokUrl === "string" ? body.tiktokUrl : undefined,
    });
    scheduleStorefrontPublish("storefront settings");
    return c.json({ success: true, settings });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update settings.";
    return c.json({ success: false, message }, 400);
  }
});

adminStorefrontRoute.get("/faq", async (c) => {
  try {
    const items = await listFaqItems();
    return c.json({ success: true, items });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load FAQ.";
    return c.json({ success: false, message }, 503);
  }
});

adminStorefrontRoute.post("/faq", async (c) => {
  const body = (await c.req.json()) as Record<string, unknown>;
  if (typeof body.question !== "string" || typeof body.answer !== "string") {
    return c.json({ success: false, message: "Question and answer are required." }, 400);
  }

  try {
    const item = await createFaqItem({
      question: body.question,
      answer: body.answer,
      sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : undefined,
    });
    scheduleStorefrontPublish("storefront settings");
    return c.json({ success: true, item });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create FAQ item.";
    return c.json({ success: false, message }, 400);
  }
});

adminStorefrontRoute.patch("/faq/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isFinite(id)) {
    return c.json({ success: false, message: "Invalid FAQ id." }, 400);
  }

  const body = (await c.req.json()) as Record<string, unknown>;
  try {
    const item = await updateFaqItem(id, {
      question: typeof body.question === "string" ? body.question : undefined,
      answer: typeof body.answer === "string" ? body.answer : undefined,
      sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : undefined,
    });
    if (!item) return c.json({ success: false, message: "FAQ item not found." }, 404);
    scheduleStorefrontPublish("storefront settings");
    return c.json({ success: true, item });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update FAQ item.";
    return c.json({ success: false, message }, 400);
  }
});

adminStorefrontRoute.delete("/faq/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isFinite(id)) {
    return c.json({ success: false, message: "Invalid FAQ id." }, 400);
  }

  const deleted = await deleteFaqItem(id);
  if (!deleted) return c.json({ success: false, message: "FAQ item not found." }, 404);
  scheduleStorefrontPublish("storefront settings");
  return c.json({ success: true });
});
