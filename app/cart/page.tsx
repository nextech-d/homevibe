"use client";

import React from "react";
import { useCart } from "../context/CartContext";
import Link from "next/link";
import { Trash2, Plus, Minus, ArrowLeft, ShieldCheck, Truck, RotateCcw } from "lucide-react";
import Image from "next/image";
import { formatPrice } from "../lib/formatPrice";
import { PRODUCT_IMAGE_SIZES } from "../lib/productImages";
import { productHref } from "../data/products";

export default function CartPage() {
  const { items, removeItem, updateQty, total } = useCart();

  return (
    <div className="min-h-screen bg-[var(--bg)] transition-colors duration-300 pb-24">
      <div className="mx-auto max-w-7xl px-6 py-12">
        {/* Breadcrumb / Title */}
        <div className="mb-12">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-400 hover:text-neutral-900 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Continue Shopping
          </Link>
          <h1 className="text-3xl md:text-5xl font-black text-neutral-900 mt-4 uppercase tracking-tight">
            Your Cart
          </h1>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-24 bg-white border border-neutral-200/60 rounded-3xl transition-colors">
            <h2 className="text-xl font-bold text-neutral-800">Your cart is empty</h2>
            <p className="text-sm text-neutral-500 mt-2 max-w-md mx-auto leading-relaxed">
              Browse our kitchen and gym picks — add what you like and checkout when you&apos;re ready.
            </p>
            <Link
              href="/"
              className="mt-8 inline-block bg-neutral-900 text-white px-8 py-3 rounded-full text-xs font-bold uppercase tracking-widest transition hover:scale-95 shadow-md"
            >
              Explore Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Items Column */}
            <div className="lg:col-span-8 space-y-6">
              <div className="border border-neutral-200/60 rounded-3xl bg-white overflow-hidden transition-colors">
                <div className="px-6 py-5 border-b border-neutral-100 bg-neutral-50">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">
                    Selected Items ({items.reduce((acc, curr) => acc + curr.qty, 0)})
                  </span>
                </div>
                <div className="divide-y divide-neutral-100">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-6 hover:bg-neutral-50/55 transition"
                    >
                      <div className="flex items-center gap-5">
                        {/* Product Image */}
                        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-neutral-200/30 bg-neutral-50">
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
                        <div>
                          <Link
                            href={productHref(item)}
                            className="text-sm font-bold text-neutral-900 tracking-tight leading-tight hover:underline"
                          >
                            {item.name}
                          </Link>
                          <span className="text-[10px] uppercase tracking-wider font-bold text-neutral-400 mt-1 block">
                            HomeVibe
                          </span>
                        </div>
                      </div>

                      {/* Quantity & Price Controls */}
                      <div className="flex items-center justify-between sm:justify-end gap-8 shrink-0">
                        {/* Quantity Counter */}
                        <div className="flex items-center bg-neutral-50 border border-neutral-200 rounded-full h-9">
                          <button
                            onClick={() => updateQty(item.id, item.qty - 1)}
                            className="px-3.5 h-full flex items-center justify-center text-neutral-500 hover:text-neutral-900 transition"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-xs font-bold px-2 text-neutral-800 w-6 text-center">
                            {item.qty}
                          </span>
                          <button
                            onClick={() => updateQty(item.id, item.qty + 1)}
                            className="px-3.5 h-full flex items-center justify-center text-neutral-500 hover:text-neutral-900 transition"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Price Breakdown */}
                        <div className="text-right min-w-[90px]">
                          <span className="block text-sm font-bold text-neutral-900">
                            {formatPrice(item.price * item.qty)}
                          </span>
                          {item.qty > 1 && (
                            <span className="block text-[10px] text-neutral-400 mt-0.5 font-medium">
                              {formatPrice(item.price)} each
                            </span>
                          )}
                        </div>

                        {/* Remove Action */}
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-2 bg-neutral-50 hover:bg-neutral-100 rounded-full text-neutral-400 hover:text-red-500 transition"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Guarantees Section */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="flex gap-4 p-5 bg-white border border-neutral-200/60 rounded-2xl transition-colors">
                  <ShieldCheck className="w-6 h-6 text-neutral-900 shrink-0 stroke-[1.5]" />
                  <div>
                    <h4 className="text-xs font-bold text-neutral-900">3-Year Warranty</h4>
                    <p className="text-[10px] text-neutral-500 mt-1 leading-relaxed">Parts and labour covered — we&apos;ll help if something goes wrong.</p>
                  </div>
                </div>
                <div className="flex gap-4 p-5 bg-white border border-neutral-200/60 rounded-2xl transition-colors">
                  <Truck className="w-6 h-6 text-neutral-900 shrink-0 stroke-[1.5]" />
                  <div>
                    <h4 className="text-xs font-bold text-neutral-900">Free Delivery in Nairobi</h4>
                    <p className="text-[10px] text-neutral-500 mt-1 leading-relaxed">We deliver, unpack, and can install on request.</p>
                  </div>
                </div>
                <div className="flex gap-4 p-5 bg-white border border-neutral-200/60 rounded-2xl transition-colors">
                  <RotateCcw className="w-6 h-6 text-neutral-900 shrink-0 stroke-[1.5]" />
                  <div>
                    <h4 className="text-xs font-bold text-neutral-900">Easy Returns</h4>
                    <p className="text-[10px] text-neutral-500 mt-1 leading-relaxed">5-day returns on unopened items. WhatsApp us if you need help.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-4 bg-white border border-neutral-200/60 rounded-3xl p-6 shadow-sm transition-colors">
              <h2 className="text-xs uppercase tracking-wider font-black text-neutral-900 pb-4 border-b border-neutral-100">
                Order Summary
              </h2>

              <div className="space-y-4 py-6 border-b border-neutral-100 text-xs font-semibold text-neutral-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-neutral-900">{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery</span>
                  <span className="text-emerald-500 font-bold uppercase tracking-wider text-[10px]">Complimentary</span>
                </div>
                <div className="flex justify-between">
                  <span>Installation</span>
                  <span className="text-emerald-500 font-bold uppercase tracking-wider text-[10px]">Included</span>
                </div>
              </div>

              <div className="flex justify-between items-baseline py-6">
                <span className="text-xs uppercase tracking-wider font-black text-neutral-900">Estimated Total</span>
                <span className="text-2xl font-black text-neutral-950">{formatPrice(total)}</span>
              </div>

              <Link
                href="/checkout"
                className="block w-full text-center py-3.5 bg-neutral-900 text-white text-xs font-bold tracking-widest uppercase rounded-full hover:bg-black active:scale-[0.98] transition shadow-lg"
              >
                Proceed to Checkout
              </Link>

              <div className="mt-6 text-center">
                <span className="text-[10px] text-neutral-400 leading-relaxed block">
                  Need installments? WhatsApp us — we&apos;ll walk you through the options.
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
