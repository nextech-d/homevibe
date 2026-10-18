"use client";

import React from "react";
import { useCart } from "../context/CartContext";
import { AVAILABILITY_LABEL, useCartPriceCheck } from "../hooks/useCartPriceCheck";
import CartPriceNotice from "../components/CartPriceNotice";
import Link from "next/link";
import { Trash2, Plus, Minus, ArrowLeft, ShieldCheck, Truck, RotateCcw } from "lucide-react";
import Image from "next/image";
import { formatPrice } from "../lib/formatPrice";
import { PRODUCT_IMAGE_SIZES } from "../lib/productImages";
import { productHref } from "../data/products";
import {
  focusRing,
  pageHeading,
  panelHeading,
  primaryButton,
  raisedSurface,
} from "../components/homeSurfaces";

/** A 44px round icon button: the cart's +, - and remove. */
const iconButton = `flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-neutral-700 transition-colors hover:bg-[#F6F7F9] hover:text-neutral-950 ${focusRing}`;

export default function CartPage() {
  const { items, removeItem, updateQty, total } = useCart();
  const { pricesChanged, availability } = useCartPriceCheck();

  return (
    <div className="min-h-screen pb-24">
      <div className="mx-auto max-w-7xl px-6 py-10">
        {/* Breadcrumb / Title */}
        <div className="mb-8">
          <Link
            href="/"
            className={`-ml-1 inline-flex min-h-11 items-center gap-2 rounded-full px-1 text-sm font-medium text-neutral-700 transition hover:text-neutral-950 ${focusRing}`}
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" /> Continue shopping
          </Link>
          <h1 className={`mt-2 ${pageHeading}`}>Your cart</h1>
        </div>

        {items.length === 0 ? (
          <div className={`${raisedSurface} px-6 py-16 text-center sm:py-20`}>
            <h2 className="text-xl font-semibold text-neutral-950">Your cart is empty</h2>
            <p className="mx-auto mt-2 max-w-md text-base leading-relaxed text-neutral-600">
              Browse our kitchen and gym picks — add what you like and checkout when you&apos;re ready.
            </p>
            <Link href="/" className={`mt-8 ${primaryButton}`}>
              Explore products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-10">
            {/* Items Column */}
            <div className="space-y-6 lg:col-span-8">
              {pricesChanged && <CartPriceNotice />}
              <div className={`${raisedSurface} overflow-hidden`}>
                <div className="border-b border-[#DCE0E7] bg-[#F6F7F9] px-5 py-4 sm:px-6">
                  <h2 className="text-sm font-semibold text-neutral-800">
                    Selected items ({items.reduce((acc, curr) => acc + curr.qty, 0)})
                  </h2>
                </div>
                <div className="divide-y divide-[#DCE0E7]">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center sm:gap-6 sm:p-6"
                    >
                      <div className="flex min-w-0 items-center gap-4 sm:gap-5">
                        {/* Product Image */}
                        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-[#DCE0E7] bg-white">
                          <div className="relative h-full w-full">
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              sizes={PRODUCT_IMAGE_SIZES.cart}
                              className="object-contain p-1"
                            />
                          </div>
                        </div>
                        {/* Title & Brand */}
                        <div className="min-w-0">
                          <Link
                            href={productHref(item)}
                            className={`rounded-sm text-[15px] font-semibold leading-snug text-neutral-950 hover:underline ${focusRing}`}
                          >
                            {item.name}
                          </Link>
                          <span className="mt-1 block text-xs font-medium text-neutral-600">
                            HomeVibe
                          </span>
                          {availability[item.id] && (
                            <span className="mt-1 block text-xs font-semibold text-[#8A4B00]">
                              {AVAILABILITY_LABEL[availability[item.id]]}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Quantity & Price Controls */}
                      <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end sm:gap-6">
                        {/* Quantity Counter */}
                        <div className="flex items-center rounded-full border border-[#7D8594] bg-white">
                          <button
                            onClick={() => updateQty(item.id, item.qty - 1)}
                            className={iconButton}
                            aria-label="Decrease quantity"
                          >
                            <Minus aria-hidden="true" className="h-4 w-4" />
                          </button>
                          <span className="w-7 text-center text-sm font-semibold tabular-nums text-neutral-950">
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

                        {/* Price Breakdown */}
                        <div className="min-w-[90px] text-right">
                          <span className="block text-base font-semibold tabular-nums text-[#8f4710]">
                            {formatPrice(item.price * item.qty)}
                          </span>
                          {item.qty > 1 && (
                            <span className="mt-0.5 block text-xs text-neutral-600">
                              {formatPrice(item.price)} each
                            </span>
                          )}
                        </div>

                        {/* Remove Action */}
                        <button
                          onClick={() => removeItem(item.id)}
                          className={`${iconButton} hover:text-red-700`}
                          aria-label="Remove item"
                        >
                          <Trash2 aria-hidden="true" className="h-[18px] w-[18px]" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Guarantees Section */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="flex gap-3 rounded-2xl border border-[#DCE0E7] bg-white p-5">
                  <ShieldCheck aria-hidden="true" className="h-6 w-6 shrink-0 stroke-[1.5] text-[#a85414]" />
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-950">12-month in-house warranty</h3>
                    <p className="mt-1 text-sm leading-relaxed text-neutral-600">Parts and labour covered — we&apos;ll help if something goes wrong.</p>
                  </div>
                </div>
                <div className="flex gap-3 rounded-2xl border border-[#DCE0E7] bg-white p-5">
                  <Truck aria-hidden="true" className="h-6 w-6 shrink-0 stroke-[1.5] text-[#a85414]" />
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-950">Free same-day delivery in Nairobi</h3>
                    <p className="mt-1 text-sm leading-relaxed text-neutral-600">Within 24 hours elsewhere in Kenya. We deliver, unpack, and can install on request.</p>
                  </div>
                </div>
                <div className="flex gap-3 rounded-2xl border border-[#DCE0E7] bg-white p-5">
                  <RotateCcw aria-hidden="true" className="h-6 w-6 shrink-0 stroke-[1.5] text-[#a85414]" />
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-950">Easy returns</h3>
                    <p className="mt-1 text-sm leading-relaxed text-neutral-600">5-day returns on unopened items. WhatsApp us if you need help.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Summary Sidebar */}
            <div className={`${raisedSurface} p-6 lg:col-span-4`}>
              <h2 className={`border-b border-[#DCE0E7] pb-4 ${panelHeading}`}>Order summary</h2>

              <dl className="space-y-3 border-b border-[#DCE0E7] py-5 text-sm text-neutral-700">
                <div className="flex justify-between">
                  <dt>Subtotal</dt>
                  <dd className="font-semibold tabular-nums text-neutral-950">{formatPrice(total)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>Delivery</dt>
                  <dd className="max-w-[65%] text-right font-semibold text-emerald-800">
                    Free and same-day in Nairobi. Elsewhere in Kenya within 24 hours; we confirm the cost before dispatch.
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt>Installation</dt>
                  <dd className="font-semibold text-emerald-800">Free in Nairobi</dd>
                </div>
              </dl>

              <div className="flex items-baseline justify-between py-5">
                <span className="text-base font-semibold text-neutral-950">Estimated total</span>
                <span className="text-2xl font-semibold tabular-nums text-neutral-950">{formatPrice(total)}</span>
              </div>

              <Link href="/checkout" className={`${primaryButton} h-12 w-full active:scale-[0.98]`}>
                Proceed to checkout
              </Link>

              <p className="mt-5 text-center text-sm leading-relaxed text-neutral-600">
                Need installments? WhatsApp us — we&apos;ll walk you through the options.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
