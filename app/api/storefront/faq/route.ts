import { NextResponse } from "next/server";
import { getFaqItemsData } from "../../../lib/storefront.server";
import { clientErrorMessage } from "../../../../shared/client-errors";

export async function GET() {
  try {
    const items = await getFaqItemsData();
    return NextResponse.json({ success: true, items });
  } catch (error) {
    const message = clientErrorMessage(error, "Failed to load FAQ.");
    return NextResponse.json({ success: false, message }, { status: 503 });
  }
}
