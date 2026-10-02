import { Hono } from "hono";
import { getSeoOverview, getSeoSettings, updateSeoSettings } from "../../lib/seo.js";
import { publishStorefront, scheduleStorefrontPublish } from "../../lib/publishStorefront.js";

export const adminSeoRoute = new Hono();

adminSeoRoute.get("/overview", async (c) => {
  try {
    const siteUrl =
      process.env.STOREFRONT_URL?.trim() ||
      process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
      "https://homevibe.co.ke";
    const overview = await getSeoOverview(siteUrl);
    return c.json({ success: true, overview });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load SEO overview.";
    return c.json({ success: false, message }, 503);
  }
});

adminSeoRoute.get("/global", async (c) => {
  try {
    const settings = await getSeoSettings();
    return c.json({ success: true, settings });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load SEO settings.";
    return c.json({ success: false, message }, 503);
  }
});

adminSeoRoute.patch("/global", async (c) => {
  const body = (await c.req.json()) as Record<string, unknown>;
  try {
    const settings = await updateSeoSettings({
      homepageTitle: typeof body.homepageTitle === "string" ? body.homepageTitle : undefined,
      homepageDescription:
        typeof body.homepageDescription === "string" ? body.homepageDescription : undefined,
      defaultOgImageUrl:
        typeof body.defaultOgImageUrl === "string" ? body.defaultOgImageUrl : undefined,
      googleSiteVerification:
        typeof body.googleSiteVerification === "string"
          ? body.googleSiteVerification
          : undefined,
    });
    scheduleStorefrontPublish("seo settings");
    return c.json({ success: true, settings });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update SEO settings.";
    return c.json({ success: false, message }, 400);
  }
});

adminSeoRoute.post("/publish", async (c) => {
  try {
    const publish = await publishStorefront();
    return c.json({ success: true, publish });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to publish storefront.";
    return c.json({ success: false, message }, 503);
  }
});
