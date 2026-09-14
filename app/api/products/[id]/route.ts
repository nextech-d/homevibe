import { NextResponse } from "next/server";
import { getPublishedProductByParam } from "../../../lib/inventory.server";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  if (!id?.trim()) {
    return NextResponse.json({ success: false, message: "Invalid product." }, { status: 400 });
  }

  const product = await getPublishedProductByParam(id);
  if (!product) {
    return NextResponse.json({ success: false, message: "Product not found." }, { status: 404 });
  }

  return NextResponse.json({ success: true, product });
}
