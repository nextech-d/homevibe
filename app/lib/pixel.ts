/**
 * Meta (Facebook) Pixel.
 *
 * One module so every call site spells an event the same way, and so the pixel
 * is a silent no-op until NEXT_PUBLIC_META_PIXEL_ID is set - staging and local
 * dev then send nothing, and a missing ID is never a crash.
 *
 * Product identity is the numeric catalog id, stringified. Whatever feed is
 * uploaded to Meta Commerce later has to use the same ids for its catalogue to
 * match these events.
 */
import { SITE } from "../config/site";

export const META_PIXEL_ID = SITE.metaPixelId;

/** Standard events this site sends. Custom ones go through trackPixelCustom. */
export type PixelEvent =
  | "PageView"
  | "ViewContent"
  | "AddToCart"
  | "InitiateCheckout"
  | "Purchase";

type PixelParams = Record<string, unknown>;

/** A line item in Meta's `contents` shape. */
export type PixelContent = {
  id: string;
  quantity: number;
  item_price: number;
};

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

/** Meta's `fbq`, including the queue its stub keeps until fbevents.js loads. */
type Fbq = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[][];
  push: Fbq;
  loaded: boolean;
  version: string;
};

/** Where Meta serves the pixel library; MetaPixel loads it. */
export const META_PIXEL_SCRIPT = "https://connect.facebook.net/en_US/fbevents.js";

export function pixelContentId(productId: number): string {
  return String(productId);
}

export function pixelContents(
  items: { id: number; price: number; qty: number }[]
): PixelContent[] {
  return items.map((item) => ({
    id: pixelContentId(item.id),
    quantity: item.qty,
    item_price: item.price,
  }));
}

/**
 * The page's `fbq`, created and initialised on first use. This is the stub
 * from Meta's base code: it queues calls until fbevents.js arrives and replays
 * them in order. Installing it here rather than in the loader script means an
 * event fired before that script runs - ViewContent from a product page someone
 * landed on from an ad - is queued instead of dropped.
 */
function getFbq(): Fbq | null {
  if (!META_PIXEL_ID || typeof window === "undefined") return null;
  if (window.fbq) return window.fbq;

  const fbq = function (...args: unknown[]) {
    if (fbq.callMethod) fbq.callMethod(...args);
    else fbq.queue.push(args);
  } as Fbq;
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = "2.0";
  fbq.queue = [];
  window.fbq = fbq;
  if (!window._fbq) window._fbq = fbq;

  fbq("init", META_PIXEL_ID);
  return fbq;
}

/**
 * Fires a standard event. Safe to call from anywhere on the client: with no
 * pixel configured, or during a server render, it does nothing.
 *
 * `eventID` lets Meta drop a repeat of the same event, e.g. a Purchase keyed
 * on its order.
 */
export function trackPixel(
  event: PixelEvent,
  params?: PixelParams,
  options?: { eventID?: string }
): void {
  const fbq = getFbq();
  if (!fbq) return;
  if (options) fbq("track", event, params ?? {}, options);
  else fbq("track", event, params);
}

/** The currency every value we report is denominated in. */
export const PIXEL_CURRENCY = SITE.currency.code;
