"use client";

import { useState, useCallback } from "react";
import { useCart } from "../context/CartContext";
import type { Appliance } from "../data/products";
import { getProductThumbnail } from "../lib/productImages";

export function useAddToCart() {
  const { addItem } = useCart();
  const [addedIds, setAddedIds] = useState<Record<number, boolean>>({});

  const handleAddToCart = useCallback(
    (e: React.MouseEvent, appliance: Appliance, qty = 1) => {
      e.stopPropagation();
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
    [addItem]
  );

  return { handleAddToCart, addedIds };
}
