import { NextResponse } from "next/server";
import { getAllCategories } from "../../../lib/categories.server";
import { clientErrorMessage } from "../../../../shared/client-errors";

export async function GET() {
  try {
    const categories = await getAllCategories();
    return NextResponse.json({ success: true, categories });
  } catch (error) {
    const message = clientErrorMessage(error, "Failed to load categories.");
    return NextResponse.json({ success: false, message }, { status: 503 });
  }
}
