import { Prisma } from "@prisma/client";
import { getPrisma } from "./db.js";

/**
 * "System data": option types (Size, Color, Capacity...) and their values.
 * Products tick values; there is no price or stock per option.
 */

export type OptionValueItem = {
  id: number;
  value: string;
  sortOrder: number;
  /** Products with this value ticked. */
  productCount: number;
};

export type OptionTypeItem = {
  id: number;
  name: string;
  sortOrder: number;
  values: OptionValueItem[];
  /** Distinct products with any of this type's values ticked. */
  productCount: number;
};

export type OptionResult<T> = { ok: true; data: T } | { ok: false; status: 400 | 404 | 409 | 500; message: string };

function products(count: number): string {
  return `${count} product${count === 1 ? "" : "s"}`;
}

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export async function listOptionTypes(): Promise<OptionTypeItem[]> {
  const prisma = getPrisma();
  if (!prisma) return [];

  const [types, usage] = await Promise.all([
    prisma.optionType.findMany({
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      include: {
        values: {
          orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
          include: { _count: { select: { products: true } } },
        },
      },
    }),
    prisma.$queryRaw<{ option_type_id: number; n: bigint }[]>`
      SELECT v.option_type_id, COUNT(DISTINCT p.product_id) AS n
      FROM product_option_values p
      JOIN option_values v ON v.id = p.option_value_id
      GROUP BY v.option_type_id`,
  ]);
  const typeUsage = new Map(usage.map((row) => [row.option_type_id, Number(row.n)]));

  return types.map((type) => ({
    id: type.id,
    name: type.name,
    sortOrder: type.sortOrder,
    productCount: typeUsage.get(type.id) ?? 0,
    values: type.values.map((value) => ({
      id: value.id,
      value: value.value,
      sortOrder: value.sortOrder,
      productCount: value._count.products,
    })),
  }));
}

export async function createOptionType(name: string): Promise<OptionResult<{ id: number }>> {
  const prisma = getPrisma();
  if (!prisma) return { ok: false, status: 500, message: "Database unavailable." };
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, status: 400, message: "Name is required." };

  const clash = await prisma.optionType.findFirst({
    where: { name: { equals: trimmed, mode: "insensitive" } },
  });
  if (clash) return { ok: false, status: 409, message: `"${clash.name}" already exists.` };

  const last = await prisma.optionType.aggregate({ _max: { sortOrder: true } });
  try {
    const type = await prisma.optionType.create({
      data: { name: trimmed, sortOrder: (last._max.sortOrder ?? -1) + 1 },
      select: { id: true },
    });
    return { ok: true, data: type };
  } catch (error) {
    if (isUniqueViolation(error)) return { ok: false, status: 409, message: `"${trimmed}" already exists.` };
    throw error;
  }
}

export async function renameOptionType(id: number, name: string): Promise<OptionResult<null>> {
  const prisma = getPrisma();
  if (!prisma) return { ok: false, status: 500, message: "Database unavailable." };
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, status: 400, message: "Name is required." };

  const clash = await prisma.optionType.findFirst({
    where: { name: { equals: trimmed, mode: "insensitive" }, id: { not: id } },
  });
  if (clash) return { ok: false, status: 409, message: `"${clash.name}" already exists.` };

  const { count } = await prisma.optionType.updateMany({ where: { id }, data: { name: trimmed } });
  if (count === 0) return { ok: false, status: 404, message: "Option type not found." };
  return { ok: true, data: null };
}

/**
 * Deletes a type and its values, and with them every tick on a product.
 * Refused while products use it unless `force` - the admin shows the count
 * and asks first.
 */
export async function deleteOptionType(id: number, force: boolean): Promise<OptionResult<null>> {
  const prisma = getPrisma();
  if (!prisma) return { ok: false, status: 500, message: "Database unavailable." };

  const type = await prisma.optionType.findUnique({ where: { id }, select: { name: true } });
  if (!type) return { ok: false, status: 404, message: "Option type not found." };

  if (!force) {
    const used = await prisma.product.count({
      where: { optionValues: { some: { optionValue: { optionTypeId: id } } } },
    });
    if (used > 0) {
      return {
        ok: false,
        status: 409,
        message: `${type.name} is used by ${products(used)}. Deleting it removes it from them.`,
      };
    }
  }

  await prisma.optionType.delete({ where: { id } });
  return { ok: true, data: null };
}

/** Reorders types to the ids given, first to last. */
export async function reorderOptionTypes(ids: number[]): Promise<void> {
  const prisma = getPrisma();
  if (!prisma) throw new Error("Database unavailable.");
  await prisma.$transaction(
    ids.map((id, index) => prisma.optionType.updateMany({ where: { id }, data: { sortOrder: index } }))
  );
}

export async function createOptionValue(
  optionTypeId: number,
  value: string
): Promise<OptionResult<{ id: number }>> {
  const prisma = getPrisma();
  if (!prisma) return { ok: false, status: 500, message: "Database unavailable." };
  const trimmed = value.trim();
  if (!trimmed) return { ok: false, status: 400, message: "Value is required." };

  const type = await prisma.optionType.findUnique({ where: { id: optionTypeId }, select: { id: true } });
  if (!type) return { ok: false, status: 404, message: "Option type not found." };

  const clash = await prisma.optionValue.findFirst({
    where: { optionTypeId, value: { equals: trimmed, mode: "insensitive" } },
  });
  if (clash) return { ok: false, status: 409, message: `"${clash.value}" is already there.` };

  const last = await prisma.optionValue.aggregate({
    where: { optionTypeId },
    _max: { sortOrder: true },
  });
  try {
    const created = await prisma.optionValue.create({
      data: { optionTypeId, value: trimmed, sortOrder: (last._max.sortOrder ?? -1) + 1 },
      select: { id: true },
    });
    return { ok: true, data: created };
  } catch (error) {
    if (isUniqueViolation(error)) return { ok: false, status: 409, message: `"${trimmed}" is already there.` };
    throw error;
  }
}

export async function renameOptionValue(id: number, value: string): Promise<OptionResult<null>> {
  const prisma = getPrisma();
  if (!prisma) return { ok: false, status: 500, message: "Database unavailable." };
  const trimmed = value.trim();
  if (!trimmed) return { ok: false, status: 400, message: "Value is required." };

  const existing = await prisma.optionValue.findUnique({ where: { id }, select: { optionTypeId: true } });
  if (!existing) return { ok: false, status: 404, message: "Value not found." };

  const clash = await prisma.optionValue.findFirst({
    where: {
      optionTypeId: existing.optionTypeId,
      value: { equals: trimmed, mode: "insensitive" },
      id: { not: id },
    },
  });
  if (clash) return { ok: false, status: 409, message: `"${clash.value}" is already there.` };

  await prisma.optionValue.update({ where: { id }, data: { value: trimmed } });
  return { ok: true, data: null };
}

/** As deleteOptionType: refused while ticked on products unless `force`. */
export async function deleteOptionValue(id: number, force: boolean): Promise<OptionResult<null>> {
  const prisma = getPrisma();
  if (!prisma) return { ok: false, status: 500, message: "Database unavailable." };

  const value = await prisma.optionValue.findUnique({
    where: { id },
    select: { value: true, _count: { select: { products: true } } },
  });
  if (!value) return { ok: false, status: 404, message: "Value not found." };

  if (!force && value._count.products > 0) {
    return {
      ok: false,
      status: 409,
      message: `"${value.value}" is used by ${products(value._count.products)}. Deleting it removes it from them.`,
    };
  }

  await prisma.optionValue.delete({ where: { id } });
  return { ok: true, data: null };
}

/** Reorders one type's values to the ids given, first to last. */
export async function reorderOptionValues(optionTypeId: number, ids: number[]): Promise<void> {
  const prisma = getPrisma();
  if (!prisma) throw new Error("Database unavailable.");
  await prisma.$transaction(
    ids.map((id, index) =>
      prisma.optionValue.updateMany({ where: { id, optionTypeId }, data: { sortOrder: index } })
    )
  );
}
