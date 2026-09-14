import { Hono } from "hono";
import type { BrandTier } from "@prisma/client";
import {
  createBrand,
  createCategory,
  createSubcategory,
  deleteBrand,
  deleteCategory,
  deleteSubcategory,
  getAdminStats,
  getBrandById,
  getCategoryById,
  getSubcategoryById,
  listBrandsFiltered,
  listCategories,
  listCategoriesFiltered,
  listSubcategories,
  updateBrand,
  updateCategory,
  updateSubcategory,
} from "../../lib/catalog.js";
import { isValidBrandLogoRef } from "../../lib/uploads.js";

export const adminCatalogRoute = new Hono();

function parseOptionalString(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function validateBrandLogo(value: unknown): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" || !isValidBrandLogoRef(value)) {
    throw new Error("Brand logo must be uploaded using the logo field.");
  }
  return value.trim();
}

function parseBrandBody(body: Record<string, unknown>) {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const origin = typeof body.origin === "string" ? body.origin.trim() : "";
  if (!name || !origin) return null;

  let logoUrl: string | null | undefined;
  try {
    logoUrl = validateBrandLogo(body.logoUrl);
  } catch (e) {
    throw e;
  }

  return {
    name,
    slug: typeof body.slug === "string" ? body.slug : undefined,
    tier:
      body.tier === "signature" || body.tier === "partner"
        ? (body.tier as BrandTier)
        : undefined,
    origin,
    logoUrl,
    metaTitle: parseOptionalString(body.metaTitle),
    metaDescription: parseOptionalString(body.metaDescription),
    sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : undefined,
    isFeatured: typeof body.isFeatured === "boolean" ? body.isFeatured : undefined,
  };
}

adminCatalogRoute.get("/stats", async (c) => {
  const stats = await getAdminStats();
  return c.json({ success: true, stats });
});

adminCatalogRoute.get("/brands", async (c) => {
  const q = c.req.query("q");
  const tierParam = c.req.query("tier");
  const tier =
    tierParam === "signature" || tierParam === "partner" ? tierParam : undefined;

  const result = await listBrandsFiltered({ q: q ?? undefined, tier });
  return c.json({ success: true, ...result });
});

adminCatalogRoute.get("/brands/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const brand = await getBrandById(id);
  if (!brand) return c.json({ success: false, message: "Brand not found." }, 404);
  return c.json({ success: true, brand });
});

adminCatalogRoute.post("/brands", async (c) => {
  try {
    const body = (await c.req.json()) as Record<string, unknown>;
    const parsed = parseBrandBody(body);
    if (!parsed) {
      return c.json({ success: false, message: "name and origin are required." }, 400);
    }
    const brand = await createBrand(parsed);
    return c.json({ success: true, brand });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid brand data.";
    return c.json({ success: false, message }, 400);
  }
});

adminCatalogRoute.patch("/brands/:id", async (c) => {
  const id = Number(c.req.param("id"));
  try {
    const body = (await c.req.json()) as Record<string, unknown>;
    const patch: Parameters<typeof updateBrand>[1] = {};

    if (body.name !== undefined) {
      if (typeof body.name !== "string" || !body.name.trim()) {
        return c.json({ success: false, message: "name cannot be empty." }, 400);
      }
      patch.name = body.name;
    }
    if (body.origin !== undefined) {
      if (typeof body.origin !== "string" || !body.origin.trim()) {
        return c.json({ success: false, message: "origin cannot be empty." }, 400);
      }
      patch.origin = body.origin;
    }
    if (body.slug !== undefined && typeof body.slug === "string") patch.slug = body.slug;
    if (typeof body.sortOrder === "number") patch.sortOrder = body.sortOrder;
    if (typeof body.isFeatured === "boolean") patch.isFeatured = body.isFeatured;
    if (body.tier !== undefined) {
      if (body.tier !== "signature" && body.tier !== "partner") {
        return c.json({ success: false, message: "Invalid tier." }, 400);
      }
      patch.tier = body.tier;
    }
    if (body.logoUrl !== undefined) patch.logoUrl = validateBrandLogo(body.logoUrl);
    if (body.metaTitle !== undefined) patch.metaTitle = parseOptionalString(body.metaTitle) ?? null;
    if (body.metaDescription !== undefined) {
      patch.metaDescription = parseOptionalString(body.metaDescription) ?? null;
    }

    const brand = await updateBrand(id, patch);
    if (!brand) return c.json({ success: false, message: "Brand not found." }, 404);
    return c.json({ success: true, brand });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid brand data.";
    return c.json({ success: false, message }, 400);
  }
});

adminCatalogRoute.delete("/brands/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const result = await deleteBrand(id);
  if (!result.ok) return c.json({ success: false, message: result.message }, 400);
  return c.json({ success: true });
});

adminCatalogRoute.get("/categories", async (c) => {
  const q = c.req.query("q");
  const result = await listCategoriesFiltered({ q: q || undefined });
  return c.json({ success: true, ...result });
});

adminCatalogRoute.post("/categories", async (c) => {
  const body = (await c.req.json()) as {
    label?: string;
    slug?: string;
    navLabel?: string;
    description?: string;
    sortOrder?: number;
  };
  if (!body.label || !body.navLabel || !body.description) {
    return c.json({ success: false, message: "label, navLabel, and description are required." }, 400);
  }
  const category = await createCategory({
    label: body.label,
    slug: body.slug,
    navLabel: body.navLabel,
    description: body.description,
    sortOrder: body.sortOrder,
  });
  return c.json({ success: true, category });
});

adminCatalogRoute.get("/categories/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const category = await getCategoryById(id);
  if (!category) return c.json({ success: false, message: "Category not found." }, 404);
  return c.json({ success: true, category });
});

adminCatalogRoute.patch("/categories/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const body = await c.req.json();
  const category = await updateCategory(id, body);
  if (!category) return c.json({ success: false, message: "Category not found." }, 404);
  return c.json({ success: true, category });
});

adminCatalogRoute.delete("/categories/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const result = await deleteCategory(id);
  if (!result.ok) return c.json({ success: false, message: result.message }, 400);
  return c.json({ success: true });
});

adminCatalogRoute.get("/subcategories", async (c) => {
  const subcategories = await listSubcategories();
  return c.json({ success: true, subcategories });
});

adminCatalogRoute.post("/subcategories", async (c) => {
  const body = (await c.req.json()) as {
    categoryId?: number;
    label?: string;
    slug?: string;
    sortOrder?: number;
  };
  if (!body.categoryId || !body.label) {
    return c.json({ success: false, message: "categoryId and label are required." }, 400);
  }
  const subcategory = await createSubcategory({
    categoryId: body.categoryId,
    label: body.label,
    slug: body.slug,
    sortOrder: body.sortOrder,
  });
  return c.json({ success: true, subcategory });
});

adminCatalogRoute.get("/subcategories/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const subcategory = await getSubcategoryById(id);
  if (!subcategory) return c.json({ success: false, message: "Subcategory not found." }, 404);
  return c.json({ success: true, subcategory });
});

adminCatalogRoute.patch("/subcategories/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const body = await c.req.json();
  const subcategory = await updateSubcategory(id, body);
  if (!subcategory) return c.json({ success: false, message: "Subcategory not found." }, 404);
  return c.json({ success: true, subcategory });
});

adminCatalogRoute.delete("/subcategories/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const result = await deleteSubcategory(id);
  if (!result.ok) return c.json({ success: false, message: result.message }, 400);
  return c.json({ success: true });
});
