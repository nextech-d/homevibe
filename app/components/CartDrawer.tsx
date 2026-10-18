"use client";

import React, { useRef, useEffect } from "react";
import { useCart } from "../context/CartContext";
import { formatPrice } from "../lib/formatPrice";
import { X, Trash2, Plus, Minus, ShoppingBag } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { PRODUCT_IMAGE_SIZES } from "../lib/productImages";
import { productHref } from "../data/products";
import { focusRing, primaryButton, secondaryButton } from "./homeSurfaces";

/** A 44px round icon button: close, +, - and remove. */
const iconButton = `flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-neutral-700 transition-colors hover:bg-[#F6F7F9] hover:text-neutral-950 active:scale-95 ${focusRing}`;

export default function CartDrawer() {
  const { items, cartOpen, setCartOpen, removeItem, updateQty, total } = useCart();
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCartOpen(false);
    };
    if (cartOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden"; // Prevent body scroll
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [cartOpen, setCartOpen]);

  if (!cartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/45 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
        onClick={() => setCartOpen(false)}
      />

      {/* Sliding Drawer Container */}
      <div
        ref={drawerRef}
        className="relative z-10 my-5 mr-5 flex h-[calc(100vh-2.5rem)] w-[min(92vw,420px)] flex-col rounded-3xl border border-[#DCE0E7] bg-[var(--bg)] text-neutral-950 shadow-2xl transition-transform duration-300 animate-in slide-in-from-right"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-[#DCE0E7] py-3 pl-6 pr-3">
          <div className="flex items-center gap-2.5">
            <ShoppingBag aria-hidden="true" className="h-5 w-5 text-[#a85414]" />
            <h2 className="text-lg font-semibold tracking-tight text-neutral-950">Your cart</h2>
            <span className="rounded-full border border-[#DCE0E7] bg-white px-2 py-0.5 text-xs font-semibold tabular-nums text-neutral-950">
              {items.reduce((acc, curr) => acc + curr.qty, 0)}
            </span>
          </div>
          <button onClick={() => setCartOpen(false)} className={iconButton} aria-label="Close cart">
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:px-5">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center py-12 text-center">
              <ShoppingBag aria-hidden="true" className="mb-4 h-14 w-14 stroke-[1.25] text-neutral-500" />
              <h3 className="text-base font-semibold text-neutral-950">Your cart is empty</h3>
              <p className="mt-1 max-w-xs text-sm leading-relaxed text-neutral-600">
                Browse kitchen and gym gear from our featured categories.
              </p>
              <button onClick={() => setCartOpen(false)} className={`mt-6 ${primaryButton}`}>
                Start browsing
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-2xl border border-[#DCE0E7] bg-white p-3"
              >
                {/* Product Image */}
                <div className="h-[72px] w-[72px] shrink-0 overflow-hidden rounded-xl border border-[#DCE0E7] bg-white">
                  <div className="relative h-full w-full shrink-0 overflow-hidden rounded-xl bg-white">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes={PRODUCT_IMAGE_SIZES.cart}
                      className="object-contain p-1"
                    />
                  </div>
                </div>

                {/* Info & Quantity controls */}
                <div className="flex-1 min-w-0">
                  <Link
                    href={productHref(item)}
                    onClick={() => setCartOpen(false)}
                    className={`block truncate rounded-sm text-sm font-semibold text-neutral-950 hover:underline ${focusRing}`}
                  >
                    {item.name}
                  </Link>
                  {/* Unit price and line total share a line, so the row below
                      holds only the 44px controls: as a third column the total
                      pushed a 360px drawer past its edge. */}
                  <p className="mt-0.5 flex items-baseline justify-between gap-2 text-sm tabular-nums">
                    <span className="text-neutral-600">{formatPrice(item.price)}</span>
                    <span className="font-semibold text-[#8f4710]">{formatPrice(item.price * item.qty)}</span>
                  </p>

                  <div className="mt-1.5 flex items-center gap-1">
                    {/* Quantity selectors */}
                    <div className="flex items-center rounded-full border border-[#7D8594] bg-white">
                      <button
                        onClick={() => updateQty(item.id, item.qty - 1)}
                        className={iconButton}
                        aria-label="Decrease quantity"
                      >
                        <Minus aria-hidden="true" className="h-4 w-4" />
                      </button>
                      <span className="w-6 text-center text-sm font-semibold tabular-nums text-neutral-950">
                        {item.qty}
                      </span>
                      <button
                        onClick={() => updateQty(item.id, item.qty + 1)}
                        className={iconButton}
                        aria-label="Increase quantity"
                      >
                        <Plus aria-hidden="true" className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Delete Item */}
                    <button
                      onClick={() => removeItem(item.id)}
                      className={`${iconButton} hover:text-red-700`}
                      aria-label="Remove item"
                    >
                      <Trash2 aria-hidden="true" className="h-4 w-4" />
                    </button>
                  </div>
                </div>

              </div>
            ))
          )}
        </div>

        {/* Drawer Footer Summary */}
        {items.length > 0 && (
          <div className="rounded-b-3xl border-t border-[#DCE0E7] bg-white px-6 py-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-base font-semibold text-neutral-950">Subtotal</span>
              <span className="text-xl font-semibold tabular-nums text-neutral-950">
                {formatPrice(total)}
              </span>
            </div>
            <p className="mb-5 text-sm leading-relaxed text-neutral-600">
              Free same-day delivery in Nairobi, within 24 hours elsewhere in Kenya (we confirm the cost before dispatch). Free installation in Nairobi and a 12-month warranty.
            </p>
            <div className="space-y-3">
              <Link
                href="/checkout"
                onClick={() => setCartOpen(false)}
                className={`${primaryButton} h-12 w-full active:scale-[0.98]`}
              >
                Proceed to checkout
              </Link>
              <Link
                href="/cart"
                onClick={() => setCartOpen(false)}
                className={`${secondaryButton} w-full active:scale-[0.98]`}
              >
                View cart details
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
