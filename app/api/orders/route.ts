import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/** Vercel/serverless budget for this route (seconds). Proxy timeout must stay below this. */
export const maxDuration = 30;
import type { CartItem } from "../../context/CartContext";
import { readUserSessionCookie } from "../../lib/user-auth.constants";
import { getApiBaseUrl } from "../../lib/api-client";
import {
  forwardOrderCreate,
  ORDER_IDEMPOTENCY_RECOVERY_MS,
} from "../../lib/orders-proxy.server";
import { getOrderByTrackingId, type OrderPayload } from "../../lib/orders.server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const idempotencyKey = searchParams.get("idempotencyKey")?.trim();
  const trackingId = searchParams.get("trackingId")?.trim().toUpperCase();

  if (idempotencyKey) {
    const base = getApiBaseUrl();
    if (!base) {
      return NextResponse.json(
        { success: false, message: "Order service is not configured." },
        { status: 503 }
      );
    }
    try {
      const upstream = await fetch(
        `${base}/orders?idempotencyKey=${encodeURIComponent(idempotencyKey)}`,
        { signal: AbortSignal.timeout(ORDER_IDEMPOTENCY_RECOVERY_MS) }
      );
      const data = await upstream.json();
      return NextResponse.json(data, {
        status: upstream.ok ? 200 : upstream.status >= 400 ? upstream.status : 404,
      });
    } catch {
      return NextResponse.json(
        { success: false, message: "Unable to look up your order." },
        { status: 503 }
      );
    }
  }

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
    const sessionToken = readUserSessionCookie(cookieStore);
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
