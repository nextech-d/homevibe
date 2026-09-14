import { Hono } from "hono";
import type { StockStatus } from "@prisma/client";
import {
  createProductForAdmin,
  listBrandOptions,
  listProductsFiltered,
  listSubcategoryOptions,
  patchProductPriceStock,
  updateProductForAdmin,
  getProductForAdmin,
  type ProductFormInput,
} from "../../lib/products.js";
import { validateProductImageRefs } from "../../lib/uploads.js";

function parseGallery(body: Record<string, unknown>): string[] {
  if (Array.isArray(body.galleryPhotoIds)) {
    return body.galleryPhotoIds.filter((g): g is string => typeof g === "string");
  }
  if (typeof body.galleryPhotoIds === "string") {
    return body.galleryPhotoIds
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

function parseOptionalString(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function parseProductBody(body: Record<string, unknown>): ProductFormInput | null {
  if (
    typeof body.name !== "string" ||
    typeof body.brandId !== "number" ||
    typeof body.subcategoryId !== "number" ||
    typeof body.priceKes !== "number" ||
    typeof body.specs !== "string" ||
    typeof body.description !== "string" ||
    typeof body.primaryPhotoId !== "string"
  ) {
    return null;
  }

  const stockStatus = body.stockStatus as StockStatus;
  const validStock: StockStatus[] = ["in_stock", "low_stock", "out_of_stock"];
  if (!validStock.includes(stockStatus)) return null;

  if (body.priceKes < 0) return null;

  return {
    name: body.name,
    slug: typeof body.slug === "string" ? body.slug : undefined,
    brandId: body.brandId,
    subcategoryId: body.subcategoryId,
    priceKes: body.priceKes,
    stockStatus,
    isPublished: body.isPublished !== false,
    isFeatured: body.isFeatured === true,
    specs: body.specs,
    description: body.description,
    metaTitle: parseOptionalString(body.metaTitle),
    metaDescription: parseOptionalString(body.metaDescription),
    primaryPhotoId: body.primaryPhotoId,
    galleryPhotoIds: parseGallery(body),
  };
}

export const adminProductsRoute = new Hono();

adminProductsRoute.get("/options", async (c) => {
  const [brands, subcategories] = await Promise.all([
    listBrandOptions(),
    listSubcategoryOptions(),
  ]);
  return c.json({ success: true, brands, subcategories });
});

adminProductsRoute.get("/", async (c) => {
  const stock = c.req.query("stock") as StockStatus | undefined;
  const published = c.req.query("published");
  const brandId = c.req.query("brandId");
  const subcategoryId = c.req.query("subcategoryId");
  const q = c.req.query("q");

  const validStock: StockStatus[] = ["in_stock", "low_stock", "out_of_stock"];

  const result = await listProductsFiltered({
    stockStatus: stock && validStock.includes(stock) ? stock : undefined,
    published:
      published === "true" ? true : published === "false" ? false : undefined,
    brandId: brandId ? Number(brandId) : undefined,
    subcategoryId: subcategoryId ? Number(subcategoryId) : undefined,
    q: q ?? undefined,
  });

  return c.json({ success: true, ...result });
});

adminProductsRoute.get("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (id === 0 || Number.isNaN(id)) {
    return c.json({ success: false, message: "Invalid product id." }, 400);
  }
  const product = await getProductForAdmin(id);
  if (!product) {
    return c.json({ success: false, message: "Product not found." }, 404);
  }
  return c.json({ success: true, product });
});

adminProductsRoute.post("/", async (c) => {
  const body = (await c.req.json()) as Record<string, unknown>;
  const input = parseProductBody(body);
  if (!input) {
    return c.json({ success: false, message: "Invalid product data." }, 400);
  }

  try {
    const imageError = validateProductImageRefs(input.primaryPhotoId, input.galleryPhotoIds, {
      requirePrimary: input.isPublished,
    });
    if (imageError) {
      return c.json({ success: false, message: imageError }, 400);
    }
    const product = await createProductForAdmin(input);
    return c.json({ success: true, product });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create product.";
    return c.json({ success: false, message }, 500);
  }
});

adminProductsRoute.patch("/", async (c) => {
  const body = (await c.req.json()) as Record<string, unknown>;

  if (typeof body.id !== "number") {
    return c.json({ success: false, message: "Product id is required." }, 400);
  }

  if (body.name === undefined && body.description === undefined) {
    try {
      const product = await patchProductPriceStock(body.id, {
        priceKes: typeof body.priceKes === "number" ? body.priceKes : undefined,
        stockStatus: body.stockStatus as StockStatus | undefined,
        isPublished: typeof body.isPublished === "boolean" ? body.isPublished : undefined,
      });
      if (!product) {
        return c.json({ success: false, message: "Product not found or no valid updates." }, 404);
      }
      return c.json({ success: true, product });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Update failed.";
      return c.json({ success: false, message }, 400);
    }
  }

  const input = parseProductBody(body);
  if (!input) {
    return c.json({ success: false, message: "Invalid product data." }, 400);
  }

  const imageError = validateProductImageRefs(input.primaryPhotoId, input.galleryPhotoIds, {
    requirePrimary: input.isPublished,
  });
  if (imageError) {
    return c.json({ success: false, message: imageError }, 400);
  }

  const product = await updateProductForAdmin(body.id, input);
  if (!product) {
    return c.json({ success: false, message: "Product not found." }, 404);
  }

  return c.json({ success: true, product });
});
