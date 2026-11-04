import type { CartItem } from "../context/CartContext";
import { cartLineKey } from "../../shared/order-options";

import { readMigrated } from "./storage-migration";

const STORAGE_PREFIX = "homevibe_checkout_idempotency_v1:";
const LEGACY_STORAGE_PREFIX = "patril_checkout_idempotency_v1:";

/** Stable fingerprint for the current cart lines (same cart → same key slot). */
export function checkoutCartFingerprint(items: CartItem[]): string {
  const lines = items
    // A line with options adds its key, so another length is another cart;
    // a line without keeps the shape it always had.
    .map((item) => ({
      id: item.id,
      qty: item.qty,
      price: item.price,
      ...(item.options?.length ? { line: cartLineKey(item) } : {}),
    }))
    .sort((a, b) => a.id - b.id || (a.line ?? "").localeCompare(b.line ?? ""));
  return JSON.stringify(lines);
}

export function getOrCreateCheckoutIdempotencyKey(fingerprint: string): string {
  if (typeof window === "undefined") {
    return crypto.randomUUID();
  }
  const storageKey = STORAGE_PREFIX + fingerprint;
  try {
    const existing = readMigrated(
      sessionStorage,
      storageKey,
      LEGACY_STORAGE_PREFIX + fingerprint
    );
    if (existing && existing.length >= 8) {
      return existing;
    }
    const created = crypto.randomUUID();
    sessionStorage.setItem(storageKey, created);
    return created;
  } catch {
    return crypto.randomUUID();
  }
}

export function clearCheckoutIdempotencyKey(fingerprint: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(STORAGE_PREFIX + fingerprint);
    sessionStorage.removeItem(LEGACY_STORAGE_PREFIX + fingerprint);
  } catch {
    /* ignore */
  }
}
