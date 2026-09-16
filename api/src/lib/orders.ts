import type { OrderStatus, PaymentStatus } from "@prisma/client";
import type { CartItem } from "../types.js";
import { getPrisma } from "./db.js";
import { sendOrderEmails, sendOrderStatusEmail } from "./email.js";
import { mapDbProductToAppliance } from "./mapProduct.js";
import { validateOrderUpdate } from "./order-rules.js";

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
  idempotencyKey?: string;
};

type OrderWithItems = {
  trackingId: string;
  orderDate: Date;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  totalKes: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  deliveryCity: string;
  items: {
    productId: number | null;
    name: string;
    priceKes: number;
    quantity: number;
    imageUrl: string;
  }[];
};

function normalizeIdempotencyKey(key: string | undefined): string | undefined {
  const trimmed = key?.trim();
  if (!trimmed) return undefined;
  if (trimmed.length < 8 || trimmed.length > 128) {
    throw new Error("Invalid idempotency key.");
  }
  return trimmed;
}

function mapOrderRecordToCreateResult(order: OrderWithItems) {
  return {
    trackingId: order.trackingId,
    orderDate: order.orderDate.toISOString(),
    status: statusLabel(order.status),
    paymentStatus: paymentStatusLabel(order.paymentStatus),
    total: order.totalKes,
    customer: {
      name: order.customerName,
      email: order.customerEmail,
      phone: order.customerPhone,
      address: order.deliveryAddress,
      city: order.deliveryCity,
    },
    items: order.items.map((item) => ({
      id: item.productId ?? 0,
      name: item.name,
      price: item.priceKes,
      qty: item.quantity,
      image: item.imageUrl,
    })),
  };
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: string }).code === "P2002"
  );
}

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

const productInclude = {
  brand: true,
  subcategory: { include: { category: true } },
} as const;

export type OrderValidationResult =
  | { ok: true; items: CartItem[]; total: number }
  | { ok: false; message: string };

/** Load products from DB and recalculate totals — never trust client prices. */
export async function validateOrderItems(items: CartItem[]): Promise<OrderValidationResult> {
  const prisma = getPrisma();
  if (!prisma) {
    return { ok: false, message: "Orders require DATABASE_URL to be configured." };
  }

  if (!items.length) {
    return { ok: false, message: "Your cart is empty." };
  }

  const validItems = items.filter(
    (item) =>
      typeof item.id === "number" &&
      typeof item.qty === "number" &&
      item.qty > 0 &&
      Number.isInteger(item.qty)
  );

  if (!validItems.length) {
    return { ok: false, message: "Your cart items are invalid." };
  }

  const productIds = [...new Set(validItems.map((item) => item.id))];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isPublished: true },
    include: productInclude,
  });

  const productMap = new Map(products.map((product) => [product.id, product]));
  const resolved: CartItem[] = [];

  for (const item of validItems) {
    const product = productMap.get(item.id);
    if (!product) {
      return { ok: false, message: `"${item.name}" is no longer available.` };
    }
    if (product.stockStatus === "out_of_stock") {
      return { ok: false, message: `${product.name} is out of stock.` };
    }
    if (product.stockStatus === "low_stock") {
      return {
        ok: false,
        message: `${product.name} has limited stock — please contact us to complete this order.`,
      };
    }

    const appliance = mapDbProductToAppliance(product);
    resolved.push({
      id: product.id,
      name: product.name,
      price: product.priceKes,
      qty: item.qty,
      image: appliance.image,
    });
  }

  const total = resolved.reduce((sum, item) => sum + item.price * item.qty, 0);
  return { ok: true, items: resolved, total };
}

async function generateTrackingId(): Promise<string> {
  const prisma = getPrisma();
  if (!prisma) throw new Error("Database unavailable");

  for (let attempt = 0; attempt < 10; attempt++) {
    const trackingId = "PTL-" + Math.floor(100000 + Math.random() * 900000);
    const existing = await prisma.order.findUnique({ where: { trackingId } });
    if (!existing) return trackingId;
  }

  throw new Error("Could not generate a unique order reference.");
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

export async function createOrder(payload: OrderPayload) {
  const prisma = getPrisma();
  if (!prisma) {
    throw new Error("Orders require DATABASE_URL to be configured.");
  }

  const { name, email, phone, address, city, items, userId, saveAddress } = payload;
  const idempotencyKey = normalizeIdempotencyKey(payload.idempotencyKey);

  if (idempotencyKey) {
    const existing = await prisma.order.findUnique({
      where: { idempotencyKey },
      include: { items: true },
    });
    if (existing) {
      return mapOrderRecordToCreateResult(existing);
    }
  }

  const validated = await validateOrderItems(items);
  if (!validated.ok) {
    throw new Error(validated.message);
  }

  const { items: resolvedItems, total } = validated;
  const trackingId = await generateTrackingId();

  let order;
  try {
    order = await prisma.order.create({
      data: {
        idempotencyKey: idempotencyKey ?? null,
        trackingId,
        userId: userId ?? null,
        customerName: name.trim(),
        customerEmail: email.trim(),
        customerPhone: phone.trim(),
        deliveryAddress: address.trim(),
        deliveryCity: city.trim(),
        totalKes: total,
        items: {
          create: resolvedItems.map((item) => ({
            productId: item.id,
            name: item.name,
            priceKes: item.price,
            quantity: item.qty,
            imageUrl: item.image,
          })),
        },
      },
      include: { items: true },
    });
  } catch (error) {
    if (idempotencyKey && isUniqueConstraintError(error)) {
      const existing = await prisma.order.findUnique({
        where: { idempotencyKey },
        include: { items: true },
      });
      if (existing) {
        return mapOrderRecordToCreateResult(existing);
      }
    }
    throw error;
  }

  if (userId && saveAddress) {
    const { createSavedAddress, listUserAddresses } = await import("./users.js");
    const existing = await listUserAddresses(userId);
    const duplicate = existing.some(
      (a) => a.addressLine === address.trim() && a.city === city.trim()
    );
    if (!duplicate) {
      await createSavedAddress(userId, {
        label: "Home",
        addressLine: address.trim(),
        city: city.trim(),
        isDefault: existing.length === 0,
      });
    }
  }

  const result = {
    trackingId: order.trackingId,
    orderDate: order.orderDate.toISOString(),
    status: statusLabel(order.status),
    paymentStatus: paymentStatusLabel(order.paymentStatus),
    total: order.totalKes,
    customer: { name, email, phone, address, city },
    items: resolvedItems,
  };

  void sendOrderEmails(result);

  return result;
}

export async function getOrderCreateResultByIdempotencyKey(
  key: string
): Promise<ReturnType<typeof mapOrderRecordToCreateResult> | null> {
  const idempotencyKey = normalizeIdempotencyKey(key);
  if (!idempotencyKey) return null;

  const prisma = getPrisma();
  if (!prisma) return null;

  const order = await prisma.order.findUnique({
    where: { idempotencyKey },
    include: { items: true },
  });

  if (!order) return null;
  return mapOrderRecordToCreateResult(order);
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
  const result = await listOrdersFiltered({});
  return result.orders;
}

export type OrderListFilters = {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  /** When true, hide orders with payment pending (used by delivery quick filters). */
  excludePaymentPending?: boolean;
  q?: string;
};

export type OrderListResult = {
  orders: AdminOrder[];
  summary: {
    total: number;
    filtered: number;
    revenueFiltered: number;
    pendingPayments: number;
  };
};

export async function listOrdersFiltered(filters: OrderListFilters): Promise<OrderListResult> {
  const prisma = getPrisma();
  if (!prisma) {
    return { orders: [], summary: { total: 0, filtered: 0, revenueFiltered: 0, pendingPayments: 0 } };
  }

  const [total, pendingPayments] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { paymentStatus: "pending" } }),
  ]);

  const q = filters.q?.trim();
  const where = {
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.paymentStatus
      ? { paymentStatus: filters.paymentStatus }
      : filters.excludePaymentPending
        ? { paymentStatus: { not: "pending" as const } }
        : {}),
    ...(q
      ? {
          OR: [
            { trackingId: { contains: q, mode: "insensitive" as const } },
            { customerName: { contains: q, mode: "insensitive" as const } },
            { customerEmail: { contains: q, mode: "insensitive" as const } },
            { customerPhone: { contains: q, mode: "insensitive" as const } },
            { deliveryCity: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const orders = await prisma.order.findMany({
    where,
    include: { items: true },
    orderBy: { orderDate: "desc" },
  });

  const revenueFiltered = orders.reduce((sum, o) => sum + o.totalKes, 0);

  return {
    orders: orders.map(mapOrderToAdmin),
    summary: {
      total,
      filtered: orders.length,
      revenueFiltered,
      pendingPayments,
    },
  };
}

export async function getAdminOrderByTrackingId(trackingId: string): Promise<AdminOrder | null> {
  const prisma = getPrisma();
  if (!prisma) return null;

  const order = await prisma.order.findUnique({
    where: { trackingId: trackingId.toUpperCase() },
    include: { items: true },
  });

  return order ? mapOrderToAdmin(order) : null;
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
    return getAdminOrderByTrackingId(normalized);
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
