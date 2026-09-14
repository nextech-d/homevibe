"use client";

import React, { useRef, useEffect } from "react";
import { useCart } from "../context/CartContext";
import { formatPrice } from "../lib/formatPrice";
import { X, Trash2, Plus, Minus, ShoppingBag } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { PRODUCT_IMAGE_SIZES } from "../lib/productImages";
import { productHref } from "../data/products";

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
        className="relative z-10 w-[min(92vw,420px)] my-5 mr-5 h-[calc(100vh-2.5rem)] rounded-3xl flex flex-col bg-[var(--bg)] text-black shadow-2xl transition-transform duration-300 border border-neutral-200/70 animate-in slide-in-from-right"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-200/80">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-black" />
            <h2 className="text-lg font-bold tracking-tight text-black uppercase">
              Your Cart
            </h2>
            <span className="bg-white text-black text-xs font-bold px-2 py-0.5 rounded-full border border-neutral-200/80">
              {items.reduce((acc, curr) => acc + curr.qty, 0)}
            </span>
          </div>
          <button
            onClick={() => setCartOpen(false)}
            className="p-2 rounded-full hover:bg-black/5 text-black transition active:scale-95"
            aria-label="Close cart"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <ShoppingBag className="w-16 h-16 text-black/20 stroke-[1.25] mb-4" />
              <h3 className="text-sm font-bold text-black">
                Your cart is empty
              </h3>
              <p className="text-xs text-black/60 mt-1 max-w-xs leading-relaxed">
                Browse kitchen and gym gear from our featured categories.
              </p>
              <button
                onClick={() => setCartOpen(false)}
                className="mt-6 px-6 py-2.5 bg-black text-white text-xs font-bold tracking-wider uppercase rounded-full hover:bg-black/90 active:scale-95 transition"
              >
                Start Browsing
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 p-3 bg-white rounded-2xl border border-neutral-200/70"
              >
                {/* Product Image */}
                <div className="w-[72px] h-[72px] bg-neutral-100 rounded-xl overflow-hidden shrink-0">
                  <div className="relative h-full w-full shrink-0 overflow-hidden rounded-xl bg-neutral-50">
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
                    className="text-xs font-bold text-black truncate block hover:underline"
                  >
                    {item.name}
                  </Link>
                  <p className="text-xs text-black/60 font-semibold mt-0.5">
                    {formatPrice(item.price)}
                  </p>

                  <div className="flex items-center gap-3 mt-2.5">
                    {/* Quantity selectors */}
                    <div className="flex items-center bg-[var(--bg)] border border-neutral-200/80 rounded-full h-7">
                      <button
                        onClick={() => updateQty(item.id, item.qty - 1)}
                        className="px-2 h-full flex items-center justify-center text-black/60 hover:text-black transition"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-[11px] font-bold px-1.5 text-black">
                        {item.qty}
                      </span>
                      <button
                        onClick={() => updateQty(item.id, item.qty + 1)}
                        className="px-2 h-full flex items-center justify-center text-black/60 hover:text-black transition"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Delete Item */}
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-1 rounded-full text-black/50 hover:text-red-600 transition"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Subtotal of Item */}
                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-black">
                    {formatPrice(item.price * item.qty)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer Summary */}
        {items.length > 0 && (
          <div className="px-6 py-6 border-t border-neutral-200/80 bg-[var(--bg)] rounded-b-3xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase tracking-wider font-bold text-black/60">
                Subtotal
              </span>
              <span className="text-lg font-black text-black">
                {formatPrice(total)}
              </span>
            </div>
            <p className="text-[10px] text-black/60 mb-6 leading-relaxed">
              Shipping & taxes calculated at checkout. White-glove delivery, assembly, and 3-year warranty included.
            </p>
            <div className="space-y-3">
              <Link
                href="/checkout"
                onClick={() => setCartOpen(false)}
                className="block w-full text-center py-3 bg-black text-white text-xs font-bold tracking-widest uppercase rounded-full hover:bg-black/90 active:scale-[0.98] transition shadow-lg"
              >
                Proceed to Checkout
              </Link>
              <Link
                href="/cart"
                onClick={() => setCartOpen(false)}
                className="block w-full text-center py-3 bg-transparent border-2 border-neutral-300 text-black text-xs font-bold tracking-widest uppercase rounded-full hover:bg-black/5 active:scale-[0.98] transition"
              >
                View Cart details
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
