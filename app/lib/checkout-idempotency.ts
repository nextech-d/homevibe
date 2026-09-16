import type { CartItem } from "../context/CartContext";

const STORAGE_PREFIX = "patril_checkout_idempotency_v1:";

/** Stable fingerprint for the current cart lines (same cart → same key slot). */
export function checkoutCartFingerprint(items: CartItem[]): string {
  const lines = items
    .map((item) => ({ id: item.id, qty: item.qty, price: item.price }))
    .sort((a, b) => a.id - b.id);
  return JSON.stringify(lines);
}

export function getOrCreateCheckoutIdempotencyKey(fingerprint: string): string {
  if (typeof window === "undefined") {
    return crypto.randomUUID();
  }
  const storageKey = STORAGE_PREFIX + fingerprint;
  try {
    const existing = sessionStorage.getItem(storageKey);
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
  } catch {
    /* ignore */
  }
}
