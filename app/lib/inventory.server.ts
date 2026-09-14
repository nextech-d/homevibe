import "server-only";

import { APPLIANCES_INVENTORY, type Appliance } from "../data/products";
import { getPrisma } from "./db";
import { mapDbProductToAppliance } from "./mapProduct";

const productInclude = {
  brand: true,
  subcategory: { include: { category: true } },
} as const;

/** Load published products from Postgres, with static fallback when DB is unavailable. */
export async function getInventory(): Promise<Appliance[]> {
  if (!process.env.DATABASE_URL) {
    return APPLIANCES_INVENTORY;
  }

  const prisma = getPrisma();
  if (!prisma) {
    return APPLIANCES_INVENTORY;
  }

  try {
    const rows = await prisma.product.findMany({
      where: { isPublished: true },
      include: productInclude,
      orderBy: { id: "asc" },
    });

    if (rows.length === 0) {
      return APPLIANCES_INVENTORY;
    }

    return rows.map(mapDbProductToAppliance);
  } catch (error) {
    console.error("Failed to load inventory from database:", error);
    return APPLIANCES_INVENTORY;
  }
}

export async function getPublishedProduct(id: number): Promise<Appliance | null> {
  if (!process.env.DATABASE_URL) {
    return APPLIANCES_INVENTORY.find((item) => item.id === id) ?? null;
  }

  const prisma = getPrisma();
  if (!prisma) {
    return APPLIANCES_INVENTORY.find((item) => item.id === id) ?? null;
  }

  try {
    const row = await prisma.product.findFirst({
      where: { id, isPublished: true },
      include: productInclude,
    });
    return row ? mapDbProductToAppliance(row) : null;
  } catch (error) {
    console.error("Failed to load product from database:", error);
    return null;
  }
}

export async function getPublishedProductByParam(param: string): Promise<Appliance | null> {
  const trimmed = param.trim();
  if (!trimmed) return null;
  if (/^\d+$/.test(trimmed)) {
    return getPublishedProduct(Number(trimmed));
  }

  if (!process.env.DATABASE_URL) {
    return APPLIANCES_INVENTORY.find((item) => item.slug === trimmed.toLowerCase()) ?? null;
  }

  const prisma = getPrisma();
  if (!prisma) {
    return APPLIANCES_INVENTORY.find((item) => item.slug === trimmed.toLowerCase()) ?? null;
  }

  try {
    const row = await prisma.product.findFirst({
      where: { slug: trimmed.toLowerCase(), isPublished: true },
      include: productInclude,
    });
    return row ? mapDbProductToAppliance(row) : null;
  } catch (error) {
    console.error("Failed to load product from database:", error);
    return null;
  }
}
