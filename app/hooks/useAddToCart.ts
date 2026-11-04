"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "../context/CartContext";
import { productHref } from "../data/products";
import type { CatalogProduct } from "../lib/inventory";
import { getProductThumbnail } from "../lib/productImages";

export function useAddToCart() {
  const { addItem } = useCart();
  const router = useRouter();
  const [addedIds, setAddedIds] = useState<Record<number, boolean>>({});

  const handleAddToCart = useCallback(
    (e: React.MouseEvent, appliance: CatalogProduct, qty = 1) => {
      e.stopPropagation();
      // A product with options needs a length, size... chosen first, which
      // only its page can ask for.
      if (appliance.hasOptions) {
        router.push(productHref(appliance));
        return;
      }
      addItem(
        {
          id: appliance.id,
          slug: appliance.slug,
          name: appliance.name,
          price: appliance.price,
          image: getProductThumbnail(appliance),
        },
        qty
      );
      setAddedIds((prev) => ({ ...prev, [appliance.id]: true }));
      setTimeout(() => {
        setAddedIds((prev) => ({ ...prev, [appliance.id]: false }));
      }, 2000);
    },
    [addItem, router]
  );

  return { handleAddToCart, addedIds };
}
