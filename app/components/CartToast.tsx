"use client";

import React from "react";
import { useCart } from "../context/CartContext";
import { CheckCircle2, ShoppingBag, X } from "lucide-react";
import { focusRing, raisedSurface } from "./homeSurfaces";

export default function CartToast() {
  const { toast, dismissToast, setCartOpen } = useCart();

  if (!toast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 z-[60] w-[min(92vw,380px)] -translate-x-1/2 animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      <div className={`${raisedSurface} flex items-center gap-3 py-2 pl-4 pr-2 shadow-2xl`}>
        <CheckCircle2 aria-hidden="true" className="h-5 w-5 shrink-0 text-emerald-700" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-neutral-950">{toast.itemName}</p>
          <p className="text-xs text-neutral-600">
            {toast.qty > 1 ? `${toast.qty} items added` : "Added to cart"}
          </p>
        </div>
        <button
          onClick={() => {
            dismissToast();
            setCartOpen(true);
          }}
          className={`flex min-h-11 shrink-0 items-center gap-1.5 rounded-full bg-[#a85414] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#8f4710] ${focusRing}`}
        >
          <ShoppingBag aria-hidden="true" className="h-4 w-4" />
          View
        </button>
        <button
          onClick={dismissToast}
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-neutral-600 transition hover:bg-[#F6F7F9] hover:text-neutral-950 ${focusRing}`}
          aria-label="Dismiss"
        >
          <X aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
