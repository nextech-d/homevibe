import { NextResponse, type NextRequest } from "next/server";
import { getCurrentPrices, PRICE_CHECK_MAX_IDS } from "../../lib/inventory.server";

/**
 * Today's price and stock for the products in a cart: ?ids=12,40,88. Only
 * published products come back, so an id that's missing is no longer for
 * sale. Checkout still charges the database price whatever the cart says;
 * this is what lets the cart show it first.
 */
export async function GET(request: NextRequest) {
  const ids = (request.nextUrl.searchParams.get("ids") ?? "")
    .split(",")
    .slice(0, PRICE_CHECK_MAX_IDS)
    .map((part) => Number(part.trim()))
    .filter((id) => Number.isInteger(id) && id > 0);

  try {
    const products = await getCurrentPrices(ids);
    return NextResponse.json(
      { success: true, products },
      { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" } }
    );
  } catch (error) {
    console.error("Price check failed:", error);
    return NextResponse.json({ success: false, message: "Prices couldn't be checked." }, { status: 503 });
  }
}
