"use client";

import { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";
import { isOutOfStock } from "../lib/inventory";

/** Why a product in the cart can't be ordered as it stands, if it can't. */
export type CartAvailability = "unavailable" | "out-of-stock";

export const PRICE_CHANGE_NOTICE =
  "Some prices have changed since you added them. Your cart shows the current prices.";

export const AVAILABILITY_LABEL: Record<CartAvailability, string> = {
  unavailable: "No longer available",
  "out-of-stock": "Out of stock",
};

/**
 * Checks the cart against today's prices once it has loaded, for the cart and
 * checkout pages. A changed price is written into the cart, so what the
 * shopper sees is what they'll pay - checkout charges the database price
 * either way. A product that's unpublished or out of stock is reported for
 * the page to say so. A check that fails leaves the cart as it is.
 */
export function useCartPriceCheck() {
  const { items, hydrated, updatePrices } = useCart();
  const [pricesChanged, setPricesChanged] = useState(false);
  const [availability, setAvailability] = useState<Record<number, CartAvailability>>({});

  // Keyed on the ids alone: a quantity change needs no new check, and the
  // price update this makes mustn't trigger another.
  const idKey = [...new Set(items.map((i) => i.id))].sort((a, b) => a - b).join(",");

  useEffect(() => {
    if (!hydrated || !idKey) return;
    const controller = new AbortController();
    fetch(`/api/prices?ids=${idKey}`, { signal: controller.signal })
      .then(async (res) => {
        const data = (await res.json()) as {
          success?: boolean;
          products?: { id: number; price: number; status: string }[];
        };
        if (!res.ok || !data.success || !Array.isArray(data.products)) throw new Error(`Prices answered ${res.status}`);
        const current = new Map(data.products.map((p) => [p.id, p]));
        const changed: Record<number, number> = {};
        const flags: Record<number, CartAvailability> = {};
        for (const item of items) {
          const now = current.get(item.id);
          if (!now) {
            flags[item.id] = "unavailable";
            continue;
          }
          if (isOutOfStock(now)) flags[item.id] = "out-of-stock";
          if (now.price !== item.price) changed[item.id] = now.price;
        }
        setAvailability(flags);
        if (Object.keys(changed).length > 0) {
          updatePrices(changed);
          setPricesChanged(true);
        }
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) console.error("Price check failed:", error);
      });
    return () => controller.abort();
    // items is read for the comparison only; idKey decides when to check.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, idKey]);

  return { pricesChanged, availability };
}
