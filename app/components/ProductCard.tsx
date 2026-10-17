"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { productHref } from "../data/products";
import type { CatalogProduct } from "../lib/inventory";
import { formatPrice } from "../lib/formatPrice";
import { focusRing, raisedSurface } from "./homeSurfaces";
import {
  getProductCardImage,
  PRODUCT_IMAGE_SIZES,
} from "../lib/productImages";

type ProductCardProps = {
  appliance: CatalogProduct;
  onAddToCart?: (e: React.MouseEvent, appliance: CatalogProduct) => void;
  added?: boolean;
  compact?: boolean;
  imageSizes?: string;
};

/**
 * Said only when it changes the decision: in stock is the default and goes
 * unsaid. Amber text on amber 6.4:1, neutral-700 on neutral-100 9.7:1.
 */
const STOCK_BADGES: Record<string, { label: string; className: string }> = {
  "Low Stock": { label: "Low stock", className: "bg-[#FFF4E5] text-[#8A4B00] ring-[#F5D9B0]" },
  "Out of Stock": { label: "Out of stock", className: "bg-neutral-100 text-neutral-700 ring-neutral-200" },
};

export default function ProductCard({
  appliance,
  onAddToCart,
  added = false,
  compact = false,
  imageSizes = PRODUCT_IMAGE_SIZES.card,
}: ProductCardProps) {
  const cardImage = getProductCardImage(appliance);
  const badge = STOCK_BADGES[appliance.status];

  // The ring goes round the whole card when its name link has keyboard focus:
  // the link is stretched over the card, so a ring on the link itself would
  // circle only the name. The card's overflow-hidden would clip one inside it.
  const cardShell = `@container group relative flex h-full w-full cursor-pointer flex-col overflow-hidden ${raisedSurface} transition-colors hover:border-[#c9ced8] has-[.card-link:focus-visible]:outline-2 has-[.card-link:focus-visible]:outline-offset-2 has-[.card-link:focus-visible]:outline-[#a85414]`;

  const contentPadding = compact ? "px-3 pb-3" : "px-3 pb-3 @min-[13rem]:px-4 @min-[13rem]:pb-4";

  return (
    <div className={cardShell}>
      {/* The same square on every card, the photo contained in it with room
          round the edges, so a tall fridge and a wide TV are both whole and
          sit alike. Multiplied, so a packshot's own white background melts
          into the card's. */}
      <div className={`relative aspect-square w-full shrink-0 bg-white ${compact ? "p-3" : "p-3 @min-[13rem]:p-4"}`}>
        <div className="relative h-full w-full">
          <Image
            src={cardImage}
            alt={appliance.name}
            fill
            sizes={imageSizes}
            className="object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        </div>

        {badge && (
          <span
            className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[11px] font-semibold leading-4 ring-1 ring-inset ${badge.className}`}
          >
            {badge.label}
          </span>
        )}
      </div>

      <div className={`flex min-h-0 flex-1 flex-col border-t border-[#EEF0F4] pt-3 ${contentPadding}`}>
        {/* Two lines whatever the name, so the prices and buttons in a row
            line up: the clamp cuts a long name, the min-height holds a short
            one open. */}
        <h3
          className={`line-clamp-2 font-semibold text-neutral-900 group-hover:text-neutral-700 ${
            compact ? "min-h-10 text-xs leading-5" : "min-h-10 text-[13px] leading-5 @min-[13rem]:text-sm"
          }`}
        >
          {/* The name is the link text, and the pseudo-element stretches the
              anchor over the whole card so the card stays clickable. */}
          <Link
            href={productHref(appliance)}
            className="card-link after:absolute after:inset-0 focus-visible:outline-none"
          >
            {appliance.name}
          </Link>
        </h3>

        {/* Price and Add to Cart share a line only on a card at least 17rem
            wide - what the label needs beside the dearest price, Ksh
            1,500,000, at this size. Narrower (two across a phone) the
            button goes under the price, full width. */}
        <div className="mt-auto flex flex-col gap-2.5 pt-2 @min-[17rem]:flex-row @min-[17rem]:items-center @min-[17rem]:justify-between">
          <p
            className={`shrink-0 font-bold tabular-nums tracking-tight text-neutral-950 ${
              compact ? "text-sm" : "text-[15px] @min-[13rem]:text-base"
            }`}
          >
            {formatPrice(appliance.price)}
          </p>

          {!compact && onAddToCart && (
            <button
              onClick={(e) => onAddToCart(e, appliance)}
              disabled={added}
              // Above the stretched anchor, so Add to Cart stays a button.
              className={`relative z-10 inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-1.5 rounded-full border px-4 text-xs font-semibold transition active:scale-[0.98] @min-[17rem]:w-auto ${focusRing} ${
                added
                  ? "border-emerald-700 bg-emerald-700 text-white"
                  : "border-[#DCE0E7] bg-white text-neutral-900 hover:border-[#a85414] hover:text-[#8f4710]"
              }`}
            >
              <ShoppingCart aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
              {added ? "Added" : "Add to cart"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
