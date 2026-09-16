import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/** Vercel/serverless budget for this route (seconds). Proxy timeout must stay below this. */
export const maxDuration = 30;
import type { CartItem } from "../../context/CartContext";
import { USER_SESSION_COOKIE } from "../../lib/user-auth.constants";
import { forwardOrderCreate } from "../../lib/orders-proxy.server";
import { getOrderByTrackingId, type OrderPayload } from "../../lib/orders.server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const trackingId = searchParams.get("trackingId")?.trim().toUpperCase();

  if (!trackingId) {
    return NextResponse.json(
      { success: false, message: "Order reference is required." },
      { status: 400 }
    );
  }

  const order = await getOrderByTrackingId(trackingId);

  if (!order) {
    return NextResponse.json(
      { success: false, message: "No order found with that reference." },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, order });
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as OrderPayload;
    const { name, email, phone, address, city, items, saveAddress } = payload;

    if (!name?.trim() || !email?.trim() || !phone?.trim() || !address?.trim() || !city?.trim()) {
      return NextResponse.json(
        { success: false, proxyError: false, message: "Delivery information is required." },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, proxyError: false, message: "Your cart is empty." },
        { status: 400 }
      );
    }

    const validItems = items.filter(
      (item): item is CartItem =>
        typeof item.id === "number" &&
        typeof item.name === "string" &&
        typeof item.price === "number" &&
        typeof item.qty === "number" &&
        item.qty > 0
    );

    if (validItems.length === 0) {
      return NextResponse.json(
        { success: false, proxyError: false, message: "Your cart items are invalid." },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(USER_SESSION_COOKIE)?.value;
    const idempotencyKey = request.headers.get("Idempotency-Key");

    return forwardOrderCreate(
      {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
        items: validItems,
        saveAddress: Boolean(saveAddress),
      },
      sessionToken,
      idempotencyKey
    );
  } catch (error: unknown) {
    console.error("Order proxy request parse failure:", error);
    return NextResponse.json(
      {
        success: false,
        code: "ORDER_PROXY_UNAVAILABLE",
        proxyError: true,
        message: "Unable to process your order request. Please try again.",
      },
      { status: 500 }
    );
  }
}
