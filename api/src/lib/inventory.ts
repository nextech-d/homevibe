import { getPrisma } from "./db.js";
import { mapDbProductToAppliance } from "./mapProduct.js";
import type { Appliance } from "../types.js";

const productInclude = {
  brand: true,
  subcategory: { include: { category: true } },
} as const;

export async function getInventory(): Promise<Appliance[]> {
  const prisma = getPrisma();
  if (!prisma) {
    throw new Error("DATABASE_URL is required.");
  }

  const rows = await prisma.product.findMany({
    where: { isPublished: true },
    include: productInclude,
    orderBy: { id: "asc" },
  });

  return rows.map(mapDbProductToAppliance);
}

export async function getPublishedProduct(id: number): Promise<Appliance | null> {
  const prisma = getPrisma();
  if (!prisma) {
    throw new Error("DATABASE_URL is required.");
  }

  const row = await prisma.product.findFirst({
    where: { id, isPublished: true },
    include: productInclude,
  });

  return row ? mapDbProductToAppliance(row) : null;
}

export async function getPublishedProductByParam(param: string): Promise<Appliance | null> {
  const trimmed = param.trim();
  if (!trimmed) return null;
  if (/^\d+$/.test(trimmed)) {
    return getPublishedProduct(Number(trimmed));
  }

  const prisma = getPrisma();
  if (!prisma) {
    throw new Error("DATABASE_URL is required.");
  }

  const row = await prisma.product.findFirst({
    where: { slug: trimmed.toLowerCase(), isPublished: true },
    include: productInclude,
  });

  return row ? mapDbProductToAppliance(row) : null;
}
