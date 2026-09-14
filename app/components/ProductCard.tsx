"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import type { Appliance } from "../data/products";
import { productHref } from "../data/products";
import { formatPrice } from "../lib/formatPrice";
import {
  getProductCardImage,
  PRODUCT_IMAGE_SIZES,
} from "../lib/productImages";

type ProductCardProps = {
  appliance: Appliance;
  onAddToCart?: (e: React.MouseEvent, appliance: Appliance) => void;
  added?: boolean;
  compact?: boolean;
  imageSizes?: string;
};

export default function ProductCard({
  appliance,
  onAddToCart,
  added = false,
  compact = false,
  imageSizes = PRODUCT_IMAGE_SIZES.card,
}: ProductCardProps) {
  const router = useRouter();
  const cardImage = getProductCardImage(appliance);

  const cardShell = compact
    ? "group flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-xl border border-neutral-100 bg-white pb-3 shadow-sm transition hover:shadow-md"
    : "group flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-xl border border-neutral-100 bg-white pb-4 shadow-sm transition hover:shadow-md";

  const contentPadding = compact ? "px-3" : "px-4";

  return (
    <div onClick={() => router.push(productHref(appliance))} className={cardShell}>
      <div className="relative aspect-square w-full shrink-0 overflow-hidden bg-white">
        <Image
          src={cardImage}
          alt={appliance.name}
          fill
          sizes={imageSizes}
          className="object-contain object-top transition duration-500 group-hover:scale-105"
        />
      </div>

      <div className={`flex min-h-0 flex-1 flex-col ${contentPadding} ${compact ? "mt-3" : "mt-4"}`}>
        <h3
          className={`line-clamp-2 font-bold leading-snug text-neutral-900 group-hover:text-neutral-700 ${
            compact ? "min-h-[2.25rem] text-xs" : "min-h-[2.5rem] text-sm"
          }`}
        >
          {appliance.name}
        </h3>

        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <p
            className={`shrink-0 font-bold tabular-nums text-neutral-950 ${
              compact ? "text-xs" : "text-sm"
            }`}
          >
            {formatPrice(appliance.price)}
          </p>

          {!compact && onAddToCart && (
            <button
              onClick={(e) => onAddToCart(e, appliance)}
              disabled={added}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-[10px] font-semibold transition active:scale-[0.98] ${
                added
                  ? "bg-emerald-500 text-white"
                  : "bg-neutral-100 text-neutral-800 hover:bg-neutral-200"
              }`}
            >
              <ShoppingCart className="h-3.5 w-3.5 shrink-0" />
              {added ? "Added!" : "Add to Cart"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
