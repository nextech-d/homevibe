import { Hono } from "hono";
import type { OrderStatus, PaymentStatus, StockStatus } from "@prisma/client";
import {
  createOrder,
  getAdminOrderByTrackingId,
  getOrderByTrackingId,
  getOrderCreateResultByIdempotencyKey,
  listOrders,
  listOrdersFiltered,
  ordersToCsv,
  updateOrder,
  type OrderPayload,
} from "../lib/orders.js";
import { VALID_ORDER_STATUSES, VALID_PAYMENT_STATUSES } from "../lib/order-rules.js";
import { getUserBySessionId, extractBearerToken } from "../lib/session.js";
import type { CartItem } from "../types.js";

export const ordersRoute = new Hono();

ordersRoute.get("/", async (c) => {
  const idempotencyKey = c.req.query("idempotencyKey")?.trim();
  const trackingId = c.req.query("trackingId")?.trim().toUpperCase();

  if (idempotencyKey) {
    try {
      const order = await getOrderCreateResultByIdempotencyKey(idempotencyKey);
      if (!order) {
        return c.json({ success: false, message: "No order found for that checkout attempt." }, 404);
      }
      return c.json({
        success: true,
        trackingId: order.trackingId,
        order,
      });
    } catch {
      return c.json({ success: false, message: "Invalid idempotency key." }, 400);
    }
  }

  if (!trackingId) {
    return c.json(
      { success: false, message: "Order reference or idempotency key is required." },
      400
    );
  }

  const order = await getOrderByTrackingId(trackingId);
  if (!order) {
    return c.json({ success: false, message: "No order found with that reference." }, 404);
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
    const message = error instanceof Error ? error.message : "Unknown error";
    const isValidation =
      /empty|invalid|unavailable|out of stock|idempotency|DATABASE_URL/i.test(message);
    const status = message.includes("DATABASE_URL") ? 503 : isValidation ? 400 : 500;
    return c.json(
      {
        success: false,
        message: isValidation ? message : "Unable to place your order. Please try again.",
        error: message,
      },
      status
    );
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
    const message = error instanceof Error ? error.message : "Update failed.";
    return c.json({ success: false, message }, 400);
  }
});
