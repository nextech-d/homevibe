import { SITE } from "../config/site";
import { productHref } from "../data/products";
import { formatPrice } from "./formatPrice";
import { absoluteUrl } from "./site-url";
import { isOutOfStock } from "./inventory";

/**
 * wa.me wants digits only, in international format: no "+", no spaces, no
 * leading zero. The configured value is written for humans, so it is
 * normalised here rather than being stored twice in two shapes.
 *
 * A local number ("0712 345 678") becomes 254712345678; a bare subscriber
 * number ("712345678") is assumed local too. Anything already carrying the
 * country code is left alone.
 */
export function normalizeWhatsAppNumber(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("254")) return digits;
  if (digits.startsWith("0")) return `254${digits.slice(1)}`;
  return `254${digits}`;
}

export function buildWhatsAppUrl(message: string, phoneOverride?: string): string {
  const phone = normalizeWhatsAppNumber(phoneOverride ?? SITE.whatsapp);
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

/** What a WhatsApp enquiry needs to know about a product. */
type WhatsAppProduct = {
  id: number;
  slug?: string;
  name: string;
  price: number;
  status: string;
};

/**
 * The enquiry a product page or card opens: what it is, what it costs, and
 * the page it is on, so whoever answers is looking at the same product.
 *
 * The URL is absolute - a wa.me message is read outside the site, where
 * "/product/x" means nothing. Out of stock asks a different question, since
 * quoting a price for something nobody can buy only invites a dead end.
 */
export function buildProductWhatsAppMessage(product: WhatsAppProduct): string {
  const url = absoluteUrl(productHref(product));

  if (isOutOfStock(product)) {
    return `Hi, is the ${product.name} coming back in stock?\n${url}`;
  }

  return `Hi, I'm interested in the ${product.name} (${formatPrice(product.price)}).\n${url}`;
}

export function productWhatsAppUrl(product: WhatsAppProduct): string {
  return buildWhatsAppUrl(buildProductWhatsAppMessage(product));
}
