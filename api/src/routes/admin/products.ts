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
  type ProductFaqInput,
} from "../../lib/products.js";
import { validateProductImageRefs } from "../../lib/uploads.js";
import { validateProductClaims } from "../../lib/claims.js";
import { scheduleStorefrontPublish } from "../../lib/publishStorefront.js";

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

/** One per line in the admin, an array over the wire; blanks are dropped. */
function parseHighlights(value: unknown): string[] | undefined {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  }
  return undefined;
}

function parseOptionalString(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function parseFaqs(value: unknown): ProductFaqInput[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const { question, answer, sortOrder } = entry as Record<string, unknown>;
    if (typeof question !== "string" || typeof answer !== "string") return [];
    return [
      {
        question,
        answer,
        sortOrder: typeof sortOrder === "number" ? sortOrder : undefined,
      },
    ];
  });
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
    body: parseOptionalString(body.body),
    faqs: parseFaqs(body.faqs),
    metaTitle: parseOptionalString(body.metaTitle),
    metaDescription: parseOptionalString(body.metaDescription),
    highlights: parseHighlights(body.highlights),
    claimsChecked: body.claimsChecked === true,
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
    // Checked on publish only, like the image rule: a draft can say anything.
    const claimError = input.isPublished
    ? validateProductClaims(
        [input.description, input.body, ...(input.highlights ?? [])],
        { claimsChecked: input.claimsChecked }
      )
    : null;
    if (claimError) {
      return c.json({ success: false, message: claimError }, 400);
    }
    const product = await createProductForAdmin(input);
    scheduleStorefrontPublish("product create");
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
      scheduleStorefrontPublish("product price/stock update");
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

  const claimError = input.isPublished
    ? validateProductClaims(
        [input.description, input.body, ...(input.highlights ?? [])],
        { claimsChecked: input.claimsChecked }
      )
    : null;
  if (claimError) {
    return c.json({ success: false, message: claimError }, 400);
  }

  const product = await updateProductForAdmin(body.id, input);
  if (!product) {
    return c.json({ success: false, message: "Product not found." }, 404);
  }

  scheduleStorefrontPublish("product update");
  return c.json({ success: true, product });
});
