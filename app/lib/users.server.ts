import "server-only";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { getPrisma } from "./db";
import {
  LEGACY_USER_SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  USER_SESSION_COOKIE,
  readUserSessionCookie,
} from "./user-auth.constants";

export type AuthUser = {
  id: number;
  email: string;
  name: string;
  phone: string | null;
};

export type SavedAddressRecord = {
  id: number;
  label: string;
  addressLine: string;
  city: string;
  isDefault: boolean;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

async function createSession(userId: number): Promise<string> {
  const prisma = getPrisma();
  if (!prisma) throw new Error("Database unavailable");

  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);
  const session = await prisma.session.create({
    data: { userId, expiresAt },
  });

  return session.id;
}

export async function setUserSession(sessionId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(USER_SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearUserSession(): Promise<void> {
  const cookieStore = await cookies();
  const sessionId = readUserSessionCookie(cookieStore);
  cookieStore.delete(USER_SESSION_COOKIE);
  cookieStore.delete(LEGACY_USER_SESSION_COOKIE);

  if (sessionId) {
    const prisma = getPrisma();
    if (prisma) {
      await prisma.session.deleteMany({ where: { id: sessionId } });
    }
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const prisma = getPrisma();
  if (!prisma) return null;

  const cookieStore = await cookies();
  const sessionId = readUserSessionCookie(cookieStore);
  if (!sessionId) return null;

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await prisma.session.delete({ where: { id: sessionId } }).catch(() => undefined);
    }
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    phone: session.user.phone,
  };
}

export async function registerUser(input: {
  email: string;
  password: string;
  name: string;
  phone?: string;
}): Promise<AuthUser> {
  const prisma = getPrisma();
  if (!prisma) throw new Error("Database unavailable");

  const email = normalizeEmail(input.email);
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error("An account with this email already exists.");
  }

  if (input.password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: await hashPassword(input.password),
      name: input.name.trim(),
      phone: input.phone?.trim() || null,
    },
  });

  const sessionId = await createSession(user.id);
  await setUserSession(sessionId);

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
  };
}

export async function loginUser(email: string, password: string): Promise<AuthUser> {
  const prisma = getPrisma();
  if (!prisma) throw new Error("Database unavailable");

  const user = await prisma.user.findUnique({
    where: { email: normalizeEmail(email) },
  });

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw new Error("Invalid email or password.");
  }

  const sessionId = await createSession(user.id);
  await setUserSession(sessionId);

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
  };
}

export async function listUserAddresses(userId: number): Promise<SavedAddressRecord[]> {
  const prisma = getPrisma();
  if (!prisma) return [];

  const rows = await prisma.savedAddress.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { id: "asc" }],
  });

  return rows.map((row) => ({
    id: row.id,
    label: row.label,
    addressLine: row.addressLine,
    city: row.city,
    isDefault: row.isDefault,
  }));
}

export async function getDefaultAddress(userId: number): Promise<SavedAddressRecord | null> {
  const addresses = await listUserAddresses(userId);
  return addresses.find((a) => a.isDefault) ?? addresses[0] ?? null;
}

export async function createSavedAddress(
  userId: number,
  input: { label: string; addressLine: string; city: string; isDefault?: boolean }
): Promise<SavedAddressRecord> {
  const prisma = getPrisma();
  if (!prisma) throw new Error("Database unavailable");

  if (input.isDefault) {
    await prisma.savedAddress.updateMany({
      where: { userId },
      data: { isDefault: false },
    });
  }

  const row = await prisma.savedAddress.create({
    data: {
      userId,
      label: input.label.trim() || "Home",
      addressLine: input.addressLine.trim(),
      city: input.city.trim(),
      isDefault: input.isDefault ?? false,
    },
  });

  return {
    id: row.id,
    label: row.label,
    addressLine: row.addressLine,
    city: row.city,
    isDefault: row.isDefault,
  };
}

export async function deleteSavedAddress(userId: number, addressId: number): Promise<boolean> {
  const prisma = getPrisma();
  if (!prisma) return false;

  const result = await prisma.savedAddress.deleteMany({
    where: { id: addressId, userId },
  });

  return result.count > 0;
}

export async function listOrdersForUser(userId: number) {
  const prisma = getPrisma();
  if (!prisma) return [];

  const orders = await prisma.order.findMany({
    where: { userId },
    include: { items: true },
    orderBy: { orderDate: "desc" },
  });

  return orders.map((order) => ({
    trackingId: order.trackingId,
    orderDate: order.orderDate.toISOString(),
    status: order.status,
    paymentStatus: order.paymentStatus,
    total: order.totalKes,
    items: order.items.map((item) => ({
      name: item.name,
      qty: item.quantity,
      price: item.priceKes,
    })),
  }));
}
