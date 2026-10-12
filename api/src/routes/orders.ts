import { Hono } from "hono";
import type { OrderStatus, PaymentStatus, StockStatus } from "@prisma/client";
import {
  createOrder,
  getAdminOrderByTrackingId,
  getOrderByTrackingId,
  getOrderReceiptByIdempotencyKey,
  listOrders,
  listOrdersFiltered,
  ordersToCsv,
  updateOrder,
  type OrderPayload,
} from "../lib/orders.js";
import { VALID_ORDER_STATUSES, VALID_PAYMENT_STATUSES } from "../lib/order-rules.js";
import { getUserBySessionId, extractBearerToken } from "../lib/session.js";
import { getPrisma } from "../lib/db.js";
import { checkRateLimits, clientIp, orderLookupRules } from "../../../shared/rate-limit.js";
import {
  ORDER_LOOKUP_NOT_FOUND_MESSAGE,
  ORDER_LOOKUP_RATE_LIMITED_MESSAGE,
} from "../../../shared/order-lookup.js";
import type { CartItem } from "../types.js";
import { clientErrorMessage } from "../../../shared/client-errors.js";

export const ordersRoute = new Hono();

ordersRoute.get("/", async (c) => {
  const idempotencyKey = c.req.query("idempotencyKey")?.trim();

  // Checkout recovery. Not rate-limited by IP: these come through the
  // storefront's servers, so every customer would share one address. The key
  // itself is the protection - a random UUID, valid for 15 minutes, opening a
  // receipt with no personal details.
  if (idempotencyKey) {
    try {
      const receipt = await getOrderReceiptByIdempotencyKey(idempotencyKey);
      if (!receipt) {
        return c.json({ success: false, message: "No order found for that checkout attempt." }, 404);
      }
      return c.json({ success: true, trackingId: receipt.trackingId, order: receipt });
    } catch {
      return c.json({ success: false, message: "Invalid idempotency key." }, 400);
    }
  }

  // The public order lookup: 10 per IP per 15 minutes, failing open - a
  // limiter outage shouldn't stop a customer seeing their order.
  const prisma = getPrisma();
  if (prisma) {
    const limit = await checkRateLimits(
      prisma,
      orderLookupRules(clientIp((name) => c.req.header(name))),
      "open"
    );
    if (!limit.allowed && limit.reason === "limited") {
      c.header("Retry-After", String(limit.retryAfterSeconds));
      return c.json({ success: false, message: ORDER_LOOKUP_RATE_LIMITED_MESSAGE }, 429);
    }
  }

  const trackingId = c.req.query("trackingId")?.trim();
  // The phone travels in a header, not the query string, so it stays out of
  // request logs and browser history.
  const phone = c.req.header("x-order-phone")?.trim();
  if (!trackingId || !phone) {
    return c.json(
      { success: false, message: "Enter your order reference and the phone number you ordered with." },
      400
    );
  }

  // Unknown reference and wrong phone get the same answer.
  const order = await getOrderByTrackingId(trackingId, phone);
  if (!order) {
    return c.json({ success: false, message: ORDER_LOOKUP_NOT_FOUND_MESSAGE }, 404);
  }

  return c.json({ success: true, order });
});

ordersRoute.post("/", async (c) => {
  try {
    const payload = (await c.req.json()) as OrderPayload;
    const { name, email, phone, address, city, items, saveAddress } = payload;

    if (!name?.trim() || !email?.trim() || !phone?.trim() || !address?.trim() || !city?.trim()) {
      return c.json({ success: false, message: "Delivery information is required." }, 400);
    }

    if (!items?.length) {
      return c.json({ success: false, message: "Your cart is empty." }, 400);
    }

    const sessionToken = extractBearerToken(c.req.header("Authorization"));
    const user = await getUserBySessionId(sessionToken ?? undefined);
    const idempotencyKey =
      c.req.header("Idempotency-Key")?.trim() ||
      (typeof (payload as { idempotencyKey?: string }).idempotencyKey === "string"
        ? (payload as { idempotencyKey?: string }).idempotencyKey?.trim()
        : undefined);

    const order = await createOrder({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      address: address.trim(),
      city: city.trim(),
      items: items as CartItem[],
      total: 0,
      userId: user?.id,
      saveAddress: Boolean(saveAddress),
      idempotencyKey,
    });

    return c.json({
      success: true,
      message: "Order placed successfully.",
      trackingId: order.trackingId,
      order,
    });
  } catch (error) {
    // Cart problems the customer can act on ("... is out of stock", "...
    // is no longer available") are shown as written; everything else is
    // logged and answered generically - no raw error goes back any more.
    const raw = error instanceof Error ? error.message : "";
    if (raw.includes("DATABASE_URL")) {
      console.error("Order failed, database not configured:", error);
      return c.json({ success: false, message: "Ordering is temporarily unavailable. Please try again shortly." }, 503);
    }
    // Only a message the code wrote can count as a cart problem - a Prisma
    // error starting "Invalid `prisma..." must not pass for one.
    const generic = "Unable to place your order. Please try again.";
    const shown = clientErrorMessage(error, generic);
    if (shown !== generic && /empty|invalid|unavailable|no longer available|out of stock|limited stock|idempotency/i.test(shown)) {
      return c.json({ success: false, message: shown }, 400);
    }
    if (shown !== generic) console.error("Order failed:", error);
    return c.json({ success: false, message: generic }, 500);
  }
});

export const adminOrdersRoute = new Hono();

adminOrdersRoute.get("/", async (c) => {
  const status = c.req.query("status") as import("@prisma/client").OrderStatus | undefined;
  const paymentStatus = c.req.query("payment") as
    | import("@prisma/client").PaymentStatus
    | undefined;
  const q = c.req.query("q");
  const excludePending = c.req.query("excludePending") === "1";

  const validStatuses = ["confirmed", "preparing", "shipped", "delivered", "cancelled"];
  const validPayments = ["pending", "paid", "refunded"];

  const result = await listOrdersFiltered({
    status: status && validStatuses.includes(status) ? status : undefined,
    paymentStatus:
      paymentStatus && validPayments.includes(paymentStatus) ? paymentStatus : undefined,
    excludePaymentPending: excludePending && !paymentStatus,
    q: q ?? undefined,
  });

  return c.json({ success: true, ...result });
});

adminOrdersRoute.get("/export", async (c) => {
  const orders = await listOrders();
  const csv = ordersToCsv(orders);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="homevibe-orders-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
});

adminOrdersRoute.get("/:trackingId", async (c) => {
  const trackingId = c.req.param("trackingId");
  const order = await getAdminOrderByTrackingId(trackingId);
  if (!order) {
    return c.json({ success: false, message: "Order not found." }, 404);
  }
  return c.json({ success: true, order });
});

adminOrdersRoute.patch("/", async (c) => {
  const body = (await c.req.json()) as {
    trackingId?: string;
    status?: OrderStatus;
    paymentStatus?: PaymentStatus;
  };

  if (!body.trackingId) {
    return c.json({ success: false, message: "trackingId is required." }, 400);
  }

  if (!body.status && !body.paymentStatus) {
    return c.json({ success: false, message: "status or paymentStatus is required." }, 400);
  }

  if (body.status && !VALID_ORDER_STATUSES.includes(body.status)) {
    return c.json({ success: false, message: "Invalid status." }, 400);
  }

  if (body.paymentStatus && !VALID_PAYMENT_STATUSES.includes(body.paymentStatus)) {
    return c.json({ success: false, message: "Invalid payment status." }, 400);
  }

  try {
    const order = await updateOrder(body.trackingId, {
      status: body.status,
      paymentStatus: body.paymentStatus,
    });

    if (!order) {
      return c.json({ success: false, message: "Order not found." }, 404);
    }

    return c.json({ success: true, order });
  } catch (error) {
    const message = clientErrorMessage(error, "Update failed.");
    return c.json({ success: false, message }, 400);
  }
});
