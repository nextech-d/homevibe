import bcrypt from "bcryptjs";
import {
  DUMMY_PASSWORD_HASH,
  LOGIN_FAILED_MESSAGE,
  REGISTER_FAILED_MESSAGE,
} from "../../../shared/customer-auth.js";
import { getPrisma } from "./db.js";
import type { AuthUser } from "../types.js";
import { SESSION_MAX_AGE_SECONDS } from "../types.js";

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

export async function registerUser(input: {
  email: string;
  password: string;
  name: string;
  phone?: string;
}): Promise<{ user: AuthUser; sessionToken: string }> {
  const prisma = getPrisma();
  if (!prisma) throw new Error("Database unavailable");

  const email = normalizeEmail(input.email);
  if (input.password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }

  // Hashed before looking the email up, so a taken email costs the same
  // bcrypt time as a new one and the response time says nothing.
  const passwordHash = await hashPassword(input.password);

  // Taken: the generic message, never "already exists".
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error(REGISTER_FAILED_MESSAGE);
  }

  const user = await prisma.user
    .create({
      data: {
        email,
        passwordHash,
        name: input.name.trim(),
        phone: input.phone?.trim() || null,
      },
    })
    // Two sign-ups racing for one email: the loser gets the same message.
    .catch((error: unknown) => {
      if ((error as { code?: string })?.code === "P2002") throw new Error(REGISTER_FAILED_MESSAGE);
      throw error;
    });

  const sessionToken = await createSession(user.id);

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
    },
    sessionToken,
  };
}

export async function loginUser(
  email: string,
  password: string
): Promise<{ user: AuthUser; sessionToken: string }> {
  const prisma = getPrisma();
  if (!prisma) throw new Error("Database unavailable");

  const user = await prisma.user.findUnique({
    where: { email: normalizeEmail(email) },
  });

  if (!user) {
    // Same bcrypt work as a real check, so an unknown email isn't faster.
    await verifyPassword(password, DUMMY_PASSWORD_HASH);
    throw new Error(LOGIN_FAILED_MESSAGE);
  }
  if (!(await verifyPassword(password, user.passwordHash))) {
    throw new Error(LOGIN_FAILED_MESSAGE);
  }

  const sessionToken = await createSession(user.id);

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
    },
    sessionToken,
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
