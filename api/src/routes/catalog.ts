import { Hono } from "hono";
import { listCategoriesForStorefront, listBrands } from "../lib/catalog.js";

export const catalogRoute = new Hono();

catalogRoute.get("/categories", async (c) => {
  const categories = await listCategoriesForStorefront();
  return c.json({ success: true, categories });
});

catalogRoute.get("/brands", async (c) => {
  const brands = await listBrands();
  return c.json({
    success: true,
    brands: brands.map((brand) => ({
      id: brand.id,
      name: brand.name,
      slug: brand.slug,
      tier: brand.tier,
      origin: brand.origin,
      logoUrl: brand.logoUrl,
      isFeatured: brand.isFeatured,
    })),
  });
});
