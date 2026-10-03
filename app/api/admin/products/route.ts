import { NextResponse } from "next/server";
import type { StockStatus } from "@prisma/client";
import { validateProductClaims } from "../../../lib/claims";
import {
  createProductForAdmin,
  listProductsForAdmin,
  patchProductPriceStock,
  updateProductForAdmin,
  type ProductFormInput,
} from "../../../lib/products.server";

const VALID_STOCK: StockStatus[] = ["in_stock", "low_stock", "out_of_stock"];

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

  const highlights = Array.isArray(body.highlights)
    ? body.highlights.filter((h): h is string => typeof h === "string")
    : typeof body.highlights === "string"
      ? body.highlights
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean)
      : [];

  const galleryPhotoIds = Array.isArray(body.galleryPhotoIds)
    ? body.galleryPhotoIds.filter((g): g is string => typeof g === "string")
    : typeof body.galleryPhotoIds === "string"
      ? body.galleryPhotoIds
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

  const stockStatus = body.stockStatus as StockStatus;
  if (!VALID_STOCK.includes(stockStatus)) return null;

  return {
    name: body.name,
    slug: typeof body.slug === "string" ? body.slug : undefined,
    brandId: body.brandId,
    subcategoryId: body.subcategoryId,
    priceKes: body.priceKes,
    stockStatus,
    isPublished: body.isPublished !== false,
    specs: body.specs,
    description: body.description,
    highlights,
    claimsChecked: body.claimsChecked === true,
    primaryPhotoId: body.primaryPhotoId,
    galleryPhotoIds,
  };
}

/**
 * The claim guard, on this path too. The standalone API has had it since the
 * warranty sweep; this route is the other way into the same table, and an
 * unchecked box contents list does not care which admin typed it.
 *
 * Only description and highlights are checked because they are the only copy
 * this form can write - the long-form body belongs to the dark admin.
 */
function claimErrorFor(input: ProductFormInput): string | null {
  if (!input.isPublished) return null;
  return validateProductClaims([input.description, ...input.highlights], {
    claimsChecked: input.claimsChecked,
  });
}

export async function GET() {
  const products = await listProductsForAdmin();
  return NextResponse.json({ success: true, products });
}

export async function POST(request: Request) {
  const body = (await request.json()) as Record<string, unknown>;
  const input = parseProductBody(body);

  if (!input) {
    return NextResponse.json({ success: false, message: "Invalid product data." }, { status: 400 });
  }

  const claimError = claimErrorFor(input);
  if (claimError) {
    return NextResponse.json({ success: false, message: claimError }, { status: 400 });
  }

  try {
    const product = await createProductForAdmin(input);
    return NextResponse.json({ success: true, product });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create product.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const body = (await request.json()) as Record<string, unknown>;

  if (typeof body.id !== "number") {
    return NextResponse.json({ success: false, message: "Product id is required." }, { status: 400 });
  }

  // Quick list-page update (price + stock only)
  if (body.name === undefined && body.description === undefined) {
    const product = await patchProductPriceStock(body.id, {
      priceKes: typeof body.priceKes === "number" ? body.priceKes : undefined,
      stockStatus: body.stockStatus as StockStatus | undefined,
    });
    if (!product) {
      return NextResponse.json(
        { success: false, message: "Product not found or no valid updates." },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, product });
  }

  const input = parseProductBody({ ...body, id: undefined });
  if (!input) {
    return NextResponse.json({ success: false, message: "Invalid product data." }, { status: 400 });
  }

  const claimError = claimErrorFor(input);
  if (claimError) {
    return NextResponse.json({ success: false, message: claimError }, { status: 400 });
  }

  const product = await updateProductForAdmin(body.id, input);
  if (!product) {
    return NextResponse.json({ success: false, message: "Product not found." }, { status: 404 });
  }

  return NextResponse.json({ success: true, product });
}
