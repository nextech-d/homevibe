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
import { getPrisma } from "../../lib/db";
import {
  checkRateLimits,
  clientIp,
  orderLookupRules,
} from "../../../shared/rate-limit";
import {
  ORDER_LOOKUP_NOT_FOUND_MESSAGE,
  ORDER_LOOKUP_RATE_LIMITED_MESSAGE,
} from "../../../shared/order-lookup";
import { rejectCrossSiteWrite } from "../../lib/same-origin.server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const idempotencyKey = searchParams.get("idempotencyKey")?.trim();

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

  // The public order lookup: 10 per IP per 15 minutes - the same rule as
  // the API's - failing open, so a limiter outage doesn't stop a customer
  // seeing their order.
  const prisma = getPrisma();
  if (prisma) {
    const limit = await checkRateLimits(
      prisma,
      orderLookupRules(clientIp((name) => request.headers.get(name))),
      "open"
    );
    if (!limit.allowed && limit.reason === "limited") {
      return NextResponse.json(
        { success: false, message: ORDER_LOOKUP_RATE_LIMITED_MESSAGE },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
      );
    }
  }

  const trackingId = searchParams.get("trackingId")?.trim();
  // The phone travels in a header, not the query string, so it stays out of
  // request logs and browser history.
  const phone = request.headers.get("x-order-phone")?.trim();
  if (!trackingId || !phone) {
    return NextResponse.json(
      { success: false, message: "Enter your order reference and the phone number you ordered with." },
      { status: 400 }
    );
  }

  // Unknown reference and wrong phone get the same answer.
  const order = await getOrderByTrackingId(trackingId, phone);
  if (!order) {
    return NextResponse.json(
      { success: false, message: ORDER_LOOKUP_NOT_FOUND_MESSAGE },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, order });
}

export async function POST(request: Request) {
  const refused = rejectCrossSiteWrite(request);
  if (refused) return refused;

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
