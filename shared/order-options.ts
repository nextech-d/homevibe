/**
 * The options a customer chooses for a product (Length: 45M, ...), as they
 * travel from the product page through the cart to a saved order item. Shared
 * by the storefront and the API; no imports, like everything in shared/.
 */

/** One choice in the cart: the ids are what the server checks. */
export type CartItemOption = {
  typeId: number;
  type: string;
  valueId: number;
  value: string;
};

/** One choice on a saved order item: names only, copied when it was placed. */
export type OrderItemOption = {
  type: string;
  value: string;
};

/**
 * What identifies a cart line: the product, plus the chosen values when it
 * has any - the same product with a different length is a separate line. A
 * cart saved before options existed has no options, so its lines keep the
 * plain product id.
 */
export function cartLineKey(item: { id: number; options?: { valueId: number }[] }): string {
  const valueIds = (item.options ?? []).map((option) => option.valueId).sort((a, b) => a - b);
  return valueIds.length > 0 ? `${item.id}:${valueIds.join(",")}` : String(item.id);
}

/** "Length: 45M, Color: Red", or "" when there are none. */
export function formatItemOptions(options: OrderItemOption[] | undefined): string {
  return (options ?? []).map((option) => `${option.type}: ${option.value}`).join(", ");
}

/**
 * A stored or received options list, made safe to read: anything that isn't
 * an array of { type, value } strings is dropped rather than trusted.
 */
export function readOrderItemOptions(raw: unknown): OrderItemOption[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((entry) => {
    if (typeof entry !== "object" || entry === null) return [];
    const { type, value } = entry as Record<string, unknown>;
    return typeof type === "string" && typeof value === "string" ? [{ type, value }] : [];
  });
}

/**
 * The value ids a cart line claims to have chosen - only well-formed integer
 * ids. Whether they belong to the product is the server's to check.
 */
export function readChosenValueIds(raw: unknown): number[] | null {
  if (raw === undefined || raw === null) return [];
  if (!Array.isArray(raw)) return null;
  const ids: number[] = [];
  for (const entry of raw) {
    const id = typeof entry === "object" && entry !== null ? (entry as Record<string, unknown>).valueId : undefined;
    if (typeof id !== "number" || !Number.isInteger(id) || id <= 0) return null;
    ids.push(id);
  }
  return ids;
}
