import "server-only";

import type { OrderStatus, PaymentStatus } from "@prisma/client";
import type { CartItem } from "../context/CartContext";
import { getPrisma } from "./db";
import { sendOrderStatusEmail } from "./email.server";
import { validateOrderUpdate } from "./order-rules";

export type OrderPayload = {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  items: CartItem[];
  total: number;
  userId?: number;
  saveAddress?: boolean;
};

export type PublicOrder = {
  trackingId: string;
  orderDate: string;
  status: string;
  paymentStatus: string;
  total: number;
  customer: { name: string; city: string };
  items: CartItem[];
};

export type AdminOrder = {
  id: number;
  trackingId: string;
  orderDate: string;
  status: string;
  statusKey: OrderStatus;
  paymentStatus: string;
  paymentStatusKey: PaymentStatus;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  deliveryCity: string;
  total: number;
  items: CartItem[];
};

const STATUS_LABELS: Record<string, string> = {
  confirmed: "Confirmed — preparing for delivery",
  preparing: "Preparing for delivery",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: "Payment pending",
  paid: "Paid",
  refunded: "Refunded",
};

function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

function paymentStatusLabel(status: string): string {
  return PAYMENT_STATUS_LABELS[status] ?? status;
}

function mapOrderToAdmin(order: {
  id: number;
  trackingId: string;
  orderDate: Date;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  deliveryCity: string;
  totalKes: number;
  items: {
    productId: number | null;
    name: string;
    priceKes: number;
    quantity: number;
    imageUrl: string;
  }[];
}): AdminOrder {
  return {
    id: order.id,
    trackingId: order.trackingId,
    orderDate: order.orderDate.toISOString(),
    status: statusLabel(order.status),
    statusKey: order.status,
    paymentStatus: paymentStatusLabel(order.paymentStatus),
    paymentStatusKey: order.paymentStatus,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone,
    deliveryAddress: order.deliveryAddress,
    deliveryCity: order.deliveryCity,
    total: order.totalKes,
    items: order.items.map((item) => ({
      id: item.productId ?? 0,
      name: item.name,
      price: item.priceKes,
      qty: item.quantity,
      image: item.imageUrl,
    })),
  };
}

export async function getOrderByTrackingId(
  trackingId: string
): Promise<PublicOrder | null> {
  const prisma = getPrisma();
  if (!prisma) return null;

  const order = await prisma.order.findUnique({
    where: { trackingId: trackingId.toUpperCase() },
    include: { items: true },
  });

  if (!order) return null;

  return {
    trackingId: order.trackingId,
    orderDate: order.orderDate.toISOString(),
    status: statusLabel(order.status),
    paymentStatus: paymentStatusLabel(order.paymentStatus),
    total: order.totalKes,
    customer: { name: order.customerName, city: order.deliveryCity },
    items: order.items.map((item) => ({
      id: item.productId ?? 0,
      name: item.name,
      price: item.priceKes,
      qty: item.quantity,
      image: item.imageUrl,
    })),
  };
}

export async function listOrders(): Promise<AdminOrder[]> {
  const prisma = getPrisma();
  if (!prisma) return [];

  try {
    const orders = await prisma.order.findMany({
      include: { items: true },
      orderBy: { orderDate: "desc" },
    });

    return orders.map(mapOrderToAdmin);
  } catch (error) {
    console.error("Failed to load orders from database:", error);
    return [];
  }
}

export async function updateOrder(
  trackingId: string,
  updates: { status?: OrderStatus; paymentStatus?: PaymentStatus }
): Promise<AdminOrder | null> {
  const prisma = getPrisma();
  if (!prisma) return null;

  const normalized = trackingId.toUpperCase();
  const existing = await prisma.order.findUnique({ where: { trackingId: normalized } });
  if (!existing) return null;

  const validation = validateOrderUpdate(existing, updates);
  if (!validation.ok) {
    throw new Error(validation.message);
  }

  const data: { status?: OrderStatus; paymentStatus?: PaymentStatus } = {};
  if (updates.status) data.status = updates.status;
  if (updates.paymentStatus) data.paymentStatus = updates.paymentStatus;

  if (!Object.keys(data).length) {
    const orders = await listOrders();
    return orders.find((o) => o.trackingId.toUpperCase() === normalized) ?? null;
  }

  const order = await prisma.order.update({
    where: { trackingId: normalized },
    data,
    include: { items: true },
  });

  if (updates.status && updates.status !== existing.status) {
    void sendOrderStatusEmail({
      trackingId: order.trackingId,
      status: statusLabel(order.status),
      customerName: order.customerName,
      customerEmail: order.customerEmail,
    });
  }

  return mapOrderToAdmin(order);
}

/** @deprecated Use updateOrder */
export async function updateOrderStatus(
  trackingId: string,
  status: OrderStatus
): Promise<AdminOrder | null> {
  return updateOrder(trackingId, { status });
}

export function ordersToCsv(orders: AdminOrder[]): string {
  const header =
    "tracking_id,order_date,status,payment_status,customer_name,customer_email,customer_phone,address,city,total_kes,items";
  const rows = orders.map((order) => {
    const items = order.items
      .map((item) => `${item.name} x${item.qty}`)
      .join("; ")
      .replace(/"/g, '""');
    const fields = [
      order.trackingId,
      order.orderDate,
      order.statusKey,
      order.paymentStatusKey,
      order.customerName,
      order.customerEmail,
      order.customerPhone,
      order.deliveryAddress,
      order.deliveryCity,
      String(order.total),
      `"${items}"`,
    ];
    return fields.map((f) => `"${String(f).replace(/"/g, '""')}"`).join(",");
  });
  return [header, ...rows].join("\n");
}
