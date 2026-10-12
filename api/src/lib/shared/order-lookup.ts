/**
 * Rules for the public order lookup, shared by the API and the storefront
 * (which imports this file by relative path, so it has no imports).
 */

/**
 * A phone number reduced to digits in international form, so the many ways a
 * customer types the same Kenyan number compare equal:
 * "0712 345 678", "712345678", "+254 712 345 678" and "254712345678" all
 * become "254712345678". Other numbers are compared as their digits.
 */
export function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("254")) return digits;
  if (digits.startsWith("0") && digits.length === 10) return `254${digits.slice(1)}`;
  if (digits.length === 9 && /^[17]/.test(digits)) return `254${digits}`;
  return digits;
}

/** True when both numbers reduce to the same digits - and there are enough to mean anything. */
export function phonesMatch(entered: string, onOrder: string): boolean {
  const a = normalizePhone(entered);
  const b = normalizePhone(onOrder);
  return a.length >= 9 && a === b;
}

/** An order reference as customers type it: "ptl 123456" → "PTL-123456". */
export function normalizeTrackingId(value: string): string {
  const compact = value.trim().toUpperCase().replace(/\s+/g, "");
  const match = /^PTL-?(\d{6})$/.exec(compact);
  return match ? `PTL-${match[1]}` : compact;
}

/**
 * The one answer for every failed lookup - unknown reference, wrong phone,
 * missing phone - so the response never reveals whether a reference exists.
 */
export const ORDER_LOOKUP_NOT_FOUND_MESSAGE =
  "We couldn't find an order with that reference and phone number.";

export const ORDER_LOOKUP_RATE_LIMITED_MESSAGE =
  "Too many lookups. Please wait a few minutes and try again.";

/** Idempotency keys are the browser's crypto.randomUUID() - nothing else is accepted. */
export const IDEMPOTENCY_KEY_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** A checkout can be recovered by its idempotency key for this long after it was placed. */
export const IDEMPOTENCY_LOOKUP_WINDOW_MS = 15 * 60 * 1000;
