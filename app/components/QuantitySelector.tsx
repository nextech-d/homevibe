"use client";

import React from "react";
import { Minus, Plus } from "lucide-react";
import { focusRing } from "./homeSurfaces";

type QuantitySelectorProps = {
  qty: number;
  onChange: (qty: number) => void;
  min?: number;
  max?: number;
  variant?: "default" | "pill";
};

export default function QuantitySelector({
  qty,
  onChange,
  min = 1,
  max = 99,
  variant = "default",
}: QuantitySelectorProps) {
  const decrement = () => onChange(Math.max(min, qty - 1));
  const increment = () => onChange(Math.min(max, qty + 1));

  if (variant === "pill") {
    return (
      // 48px tall to sit level with the buttons beside it; each half is a
      // 44px-wide target with its own focus ring, drawn inside the pill.
      <div className="flex h-12 w-32 shrink-0 items-center rounded-full border border-[#7D8594] bg-white">
        <button
          type="button"
          onClick={decrement}
          disabled={qty <= min}
          className={`flex h-full w-11 items-center justify-center rounded-l-full text-neutral-900 transition hover:bg-[#F6F7F9] disabled:opacity-40 focus-visible:outline-offset-[-2px] ${focusRing}`}
          aria-label="Decrease quantity"
        >
          <Minus size={16} aria-hidden="true" />
        </button>
        <div
          aria-live="polite"
          aria-label={`Quantity ${qty}`}
          className="flex h-full flex-1 items-center justify-center text-base font-semibold tabular-nums text-neutral-950"
        >
          {qty}
        </div>
        <button
          type="button"
          onClick={increment}
          disabled={qty >= max}
          className={`flex h-full w-11 items-center justify-center rounded-r-full text-neutral-900 transition hover:bg-[#F6F7F9] disabled:opacity-40 focus-visible:outline-offset-[-2px] ${focusRing}`}
          aria-label="Increase quantity"
        >
          <Plus size={16} aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-9 items-center rounded-full border border-neutral-200/80 bg-[var(--bg)]">
      <button
        type="button"
        onClick={decrement}
        disabled={qty <= min}
        className="flex h-full items-center justify-center px-2 text-neutral-600 transition hover:text-neutral-900 disabled:opacity-40"
        aria-label="Decrease quantity"
      >
        <Minus className="h-3 w-3" />
      </button>
      <span className="px-1.5 text-[11px] font-bold text-neutral-900">{qty}</span>
      <button
        type="button"
        onClick={increment}
        disabled={qty >= max}
        className="flex h-full items-center justify-center px-2 text-neutral-600 transition hover:text-neutral-900 disabled:opacity-40"
        aria-label="Increase quantity"
      >
        <Plus className="h-3 w-3" />
      </button>
    </div>
  );
}
