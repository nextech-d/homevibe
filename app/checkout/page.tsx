"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "../context/CartContext";
import Link from "next/link";
import { CheckCircle, ArrowRight, PhoneCall } from "lucide-react";
import { formatPrice } from "../lib/formatPrice";
import { buildWhatsAppUrl } from "../lib/whatsapp";
import DemoModeBanner from "../components/DemoModeBanner";
import { SITE } from "../config/site";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, total, clearCart, hydrated } = useCart();
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [trackingId, setTrackingId] = useState("");
  const [orderTotal, setOrderTotal] = useState(0);
  const [deliveryError, setDeliveryError] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [saveAddress, setSaveAddress] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me?include=all")
      .then((r) => r.json())
      .then((data) => {
        if (!data.success || !data.user) return;
        setIsLoggedIn(true);
        setName(data.user.name ?? "");
        setEmail(data.user.email ?? "");
        setPhone(data.user.phone ?? "");
        const defaultAddr =
          data.addresses?.find((a: { isDefault: boolean }) => a.isDefault) ??
          data.addresses?.[0];
        if (defaultAddr) {
          setAddress(defaultAddr.addressLine ?? "");
          setCity(defaultAddr.city ?? "");
        }
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (items.length === 0 && step !== 2) {
      router.replace("/cart");
    }
  }, [hydrated, items.length, step, router]);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !phone || !address || !city) {
      setDeliveryError("Please fill in all required delivery fields.");
      return;
    }

    setDeliveryError("");
    setLoading(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, address, city, items, saveAddress }),
      });
      const data = await response.json();

      if (data.success === true) {
        setTrackingId(data.trackingId);
        setOrderTotal(total);
        clearCart();
        setStep(2);
      } else {
        alert(data.message || "Checkout failed. Please try again.");
      }
    } catch (err) {
      console.error("Order error", err);
      alert("Unable to place your order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const whatsappUrl = buildWhatsAppUrl(
    `Hi HomeVibe, I'd like to place an order.\n\nName: ${name}\nPhone: ${phone}\nAddress: ${address}, ${city}\n\nItems:\n` +
      items.map((item) => `• ${item.name} (Qty: ${item.qty})`).join("\n") +
      `\n\nTotal: ${formatPrice(total)}`
  );

  if (!hydrated && step !== 2) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">Loading checkout...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] transition-colors duration-300 pb-24">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <DemoModeBanner className="mb-8" />

        {step === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <form onSubmit={handlePlaceOrder} className="lg:col-span-7 bg-white border border-neutral-200/60 rounded-3xl p-6 md:p-8 space-y-6 transition-colors">
              <h2 className="text-sm uppercase tracking-wider font-black text-neutral-900 pb-3 border-b border-neutral-100">
                Delivery Details
              </h2>

              {deliveryError && (
                <p className="text-xs font-semibold text-red-600">{deliveryError}</p>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1.5">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full rounded-xl border border-neutral-300 bg-transparent px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-neutral-900 text-neutral-900"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1.5">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@domain.com"
                      className="w-full rounded-xl border border-neutral-300 bg-transparent px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-neutral-900 text-neutral-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1.5">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+254 700 000 000"
                      className="w-full rounded-xl border border-neutral-300 bg-transparent px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-neutral-900 text-neutral-900"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1.5">Physical Address *</label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Apartment suite, street address"
                    className="w-full rounded-xl border border-neutral-300 bg-transparent px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-neutral-900 text-neutral-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1.5">City *</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Nairobi, Kampala"
                    className="w-full rounded-xl border border-neutral-300 bg-transparent px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-neutral-900 text-neutral-900"
                  />
                </div>
              </div>

              {isLoggedIn && (
                <label className="flex items-center gap-2 text-xs text-neutral-600">
                  <input
                    type="checkbox"
                    checked={saveAddress}
                    onChange={(e) => setSaveAddress(e.target.checked)}
                  />
                  Save this address to my account
                </label>
              )}

              <p className="text-[11px] leading-relaxed text-neutral-500">
                Payment is arranged after you order — we&apos;ll call or WhatsApp you to confirm
                delivery and payment details. No card or M-Pesa is charged on this site yet.
              </p>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-neutral-900 text-white text-xs font-bold tracking-widest uppercase rounded-full hover:bg-black active:scale-[0.98] transition shadow-lg disabled:opacity-50"
              >
                {loading ? "Placing order..." : "Place order"} <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>

            <div className="lg:col-span-5 space-y-6">
              <div className="bg-neutral-100 border border-neutral-200/40 rounded-3xl p-6 transition-colors">
                <div className="flex items-center justify-between pb-3 border-b border-neutral-200/60">
                  <h3 className="text-xs uppercase tracking-wider font-black text-neutral-900">
                    Your Order Summary
                  </h3>
                  <Link
                    href="/cart"
                    className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 hover:text-neutral-900 transition"
                  >
                    Edit cart
                  </Link>
                </div>
                <div className="divide-y divide-neutral-200/40 py-2 max-h-56 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between py-3 items-center gap-2">
                      <span className="text-xs text-neutral-600 truncate pr-3">
                        {item.name} <span className="text-[10px] font-bold text-neutral-400">x{item.qty}</span>
                      </span>
                      <span className="text-xs font-bold text-neutral-900 shrink-0">
                        {formatPrice(item.price * item.qty)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="pt-4 border-t border-neutral-200/60 flex justify-between items-baseline">
                  <span className="text-xs uppercase tracking-wider font-bold text-neutral-400">Order Total</span>
                  <span className="text-xl font-black text-neutral-950">{formatPrice(total)}</span>
                </div>
              </div>

              <div className="bg-white border border-neutral-200/60 rounded-3xl p-6">
                <h3 className="text-xs uppercase tracking-wider font-black text-neutral-900 pb-3 border-b border-neutral-100">
                  Prefer WhatsApp?
                </h3>
                <p className="text-[10px] text-neutral-500 mt-2.5 leading-relaxed">
                  Send your order directly and our team will confirm availability and delivery.
                </p>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 flex items-center justify-center gap-2 w-full py-3 bg-transparent border-2 border-emerald-500 text-emerald-500 font-bold uppercase tracking-widest text-[9px] rounded-full hover:bg-emerald-500 hover:text-white transition active:scale-[0.95]"
                >
                  <PhoneCall className="w-3.5 h-3.5" /> Order on WhatsApp
                </a>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="max-w-md mx-auto text-center bg-white border border-neutral-200/60 rounded-3xl p-8 shadow-xl transition-colors py-16 animate-in fade-in zoom-in-95 duration-300">
            <CheckCircle className="w-16 h-16 text-neutral-950 stroke-[1.25] mx-auto mb-6 animate-bounce" />
            <h2 className="text-xl md:text-2xl font-black text-neutral-900 uppercase tracking-tight">Order placed!</h2>
            <p className="text-xs text-neutral-500 mt-2 leading-relaxed">
              Thanks, <span className="font-semibold text-neutral-800">{name}</span>. We&apos;ve saved your order and will be in touch soon.
            </p>

            {SITE.demoMode && <DemoModeBanner variant="checkout-success" className="mt-4" />}

            <div className="bg-neutral-50 rounded-2xl p-5 border border-neutral-100 my-8 text-left text-xs font-semibold text-neutral-600 space-y-2">
              <div className="flex justify-between">
                <span>Name</span>
                <span className="text-neutral-900">{name}</span>
              </div>
              <div className="flex justify-between">
                <span>Order reference</span>
                <span className="text-emerald-600 font-bold font-mono tracking-wider">{trackingId}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery</span>
                <span className="text-neutral-900 truncate max-w-[200px]">{address}, {city}</span>
              </div>
              <div className="flex justify-between border-t border-neutral-200/60 pt-2 mt-2">
                <span className="text-neutral-400">Total</span>
                <span className="text-neutral-900 font-bold">{formatPrice(orderTotal)}</span>
              </div>
            </div>

            <p className="text-[10px] text-neutral-400 mb-6 leading-relaxed max-w-xs mx-auto">
              Save your reference <span className="font-mono font-bold text-neutral-600">{trackingId}</span> to
              track status anytime. We&apos;ll also call or WhatsApp you at{" "}
              <span className="font-bold">{phone}</span> within 2 hours.
            </p>

            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href={`/track-order?id=${encodeURIComponent(trackingId)}`}
                className="inline-block px-8 py-3 bg-emerald-600 text-white text-xs font-bold tracking-widest uppercase rounded-full hover:bg-emerald-700 transition active:scale-95 shadow-md"
              >
                Track order
              </Link>
              {isLoggedIn && (
                <Link
                  href="/account/orders"
                  className="inline-block px-8 py-3 border border-neutral-300 text-neutral-700 text-xs font-bold tracking-widest uppercase rounded-full hover:border-neutral-900 hover:text-neutral-900 transition active:scale-95"
                >
                  My orders
                </Link>
              )}
              <Link
                href="/"
                className="inline-block px-8 py-3 bg-neutral-900 text-white text-xs font-bold tracking-widest uppercase rounded-full hover:bg-black transition active:scale-95 shadow-md"
              >
                Return home
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
