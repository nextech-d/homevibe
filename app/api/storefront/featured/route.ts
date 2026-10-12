import { NextResponse } from "next/server";
import { getFeaturedColumnIds } from "../../../lib/storefront.server";
import { clientErrorMessage } from "../../../../shared/client-errors";

export async function GET() {
  try {
    const columns = await getFeaturedColumnIds();
    return NextResponse.json({ success: true, columns });
  } catch (error) {
    const message = clientErrorMessage(error, "Failed to load featured slots.");
    return NextResponse.json({ success: false, message }, { status: 503 });
  }
}
