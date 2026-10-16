"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { productHref } from "../data/products";
import type { CatalogProduct } from "../lib/inventory";
import { formatPrice } from "../lib/formatPrice";
import { productWhatsAppUrl } from "../lib/whatsapp";
import { useWhatsAppNumber } from "../context/WhatsAppContext";
import WhatsAppIcon from "./WhatsAppIcon";
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

export default function ProductCard({
  appliance,
  onAddToCart,
  added = false,
  compact = false,
  imageSizes = PRODUCT_IMAGE_SIZES.card,
}: ProductCardProps) {
  const cardImage = getProductCardImage(appliance);
  const whatsappNumber = useWhatsAppNumber();

  // The ring goes round the whole card when its name link has keyboard focus:
  // the link is stretched over the card, so a ring on the link itself would
  // circle only the name. The card's overflow-hidden would clip one inside it.
  const cardShell = `@container group relative flex h-full w-full cursor-pointer flex-col overflow-hidden ${raisedSurface} transition-colors hover:border-[#c9ced8] has-[.card-link:focus-visible]:outline-2 has-[.card-link:focus-visible]:outline-offset-2 has-[.card-link:focus-visible]:outline-[#a85414] ${
    compact ? "pb-3" : "pb-4"
  }`;

  const contentPadding = compact ? "px-3" : "px-4";

  return (
    <div className={cardShell}>
      <div className="relative aspect-square w-full shrink-0 overflow-hidden bg-white">
        <Image
          src={cardImage}
          alt={appliance.name}
          fill
          sizes={imageSizes}
          className="object-contain object-top transition duration-500 group-hover:scale-105"
        />

        {/* A sibling of the card's link, never a child of it: an <a> inside an
            <a> is invalid, and the browser would drop one of the two. It sits
            above the stretched anchor on z-10, the same way Add to Cart does,
            and inside the image box so it can never reach the name or price.
            44x44 for the thumb; the white disc inside it is smaller, and always
            there, so the glyph stays visible on a dark or green photo. */}
        <a
          href={productWhatsAppUrl(appliance, whatsappNumber)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Ask about ${appliance.name} on WhatsApp`}
          className={`group/wa absolute bottom-1 right-1 z-10 flex h-11 w-11 items-center justify-center rounded-full active:scale-95 ${focusRing}`}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#25D366] shadow-md ring-1 ring-black/5 transition group-hover/wa:bg-[#25D366] group-hover/wa:text-white">
            <WhatsAppIcon className="h-5 w-5 shrink-0" />
          </span>
        </a>
      </div>

      <div className={`flex min-h-0 flex-1 flex-col ${contentPadding} ${compact ? "mt-3" : "mt-4"}`}>
        <h3
          className={`line-clamp-2 font-bold leading-snug text-neutral-900 group-hover:text-neutral-700 ${
            compact ? "min-h-[2.25rem] text-xs" : "min-h-[2.5rem] text-sm"
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

        {/* Price and Add to Cart share a line only on a card at least 15.5rem
            wide - what the label needs beside the dearest price, Ksh
            1,500,000. Narrower (two across a phone, four across a 1024px
            screen) the button was cut off at "Add", so it goes under the
            price instead, full width. */}
        <div className="mt-auto flex flex-col gap-2 pt-2 @min-[15.5rem]:flex-row @min-[15.5rem]:items-center @min-[15.5rem]:justify-between">
          <p
            className={`shrink-0 font-bold tabular-nums text-[#8f4710] ${
              compact ? "text-xs" : "text-sm"
            }`}
          >
            {formatPrice(appliance.price)}
          </p>

          {!compact && onAddToCart && (
            <button
              onClick={(e) => onAddToCart(e, appliance)}
              disabled={added}
              // Above the stretched anchor, so Add to Cart stays a button.
              className={`relative z-10 inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition active:scale-[0.98] @min-[15.5rem]:w-auto ${focusRing} ${
                added
                  ? "bg-emerald-700 text-white"
                  : "bg-neutral-100 text-neutral-800 hover:bg-neutral-200"
              }`}
            >
              <ShoppingCart className="h-3.5 w-3.5 shrink-0" />
              {added ? "Added" : "Add to cart"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
