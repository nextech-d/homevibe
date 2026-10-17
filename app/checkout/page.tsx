"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "../context/CartContext";
import Link from "next/link";
import { CheckCircle, ArrowRight, PhoneCall } from "lucide-react";
import { formatPrice } from "../lib/formatPrice";
import { buildWhatsAppUrl } from "../lib/whatsapp";
import { useWhatsAppNumber } from "../context/WhatsAppContext";
import DemoModeBanner from "../components/DemoModeBanner";
import { SITE } from "../config/site";
import {
  checkoutCartFingerprint,
  clearCheckoutIdempotencyKey,
  getOrCreateCheckoutIdempotencyKey,
} from "../lib/checkout-idempotency";
import { PIXEL_CURRENCY, pixelContentId, pixelContents, trackPixel } from "../lib/pixel";
import {
  fieldCheckbox,
  fieldInput,
  fieldLabel,
  focusRing,
  panelHeading,
  primaryButton,
  raisedSurface,
  secondaryButton,
  textLink,
} from "../components/homeSurfaces";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, total, clearCart, hydrated } = useCart();
  // The admin-set number the footer and product links dial, not config's.
  const whatsappNumber = useWhatsAppNumber();
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
  const cartFingerprint = useMemo(() => checkoutCartFingerprint(items), [items]);

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

  // Once per visit to checkout, as soon as the restored cart is known.
  const checkoutReported = useRef(false);
  useEffect(() => {
    if (!hydrated || items.length === 0 || checkoutReported.current) return;
    checkoutReported.current = true;
    trackPixel("InitiateCheckout", {
      content_type: "product",
      content_ids: items.map((item) => pixelContentId(item.id)),
      contents: pixelContents(items),
      num_items: items.reduce((sum, item) => sum + item.qty, 0),
      value: total,
      currency: PIXEL_CURRENCY,
    });
  }, [hydrated, items, total]);

  /** Reports a placed order, keyed on its tracking id so Meta counts it once. */
  const reportPurchase = (orderTrackingId: string, value: number) => {
    trackPixel(
      "Purchase",
      {
        content_type: "product",
        content_ids: items.map((item) => pixelContentId(item.id)),
        contents: pixelContents(items),
        num_items: items.reduce((sum, item) => sum + item.qty, 0),
        value,
        currency: PIXEL_CURRENCY,
      },
      { eventID: `order-${orderTrackingId}` }
    );
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !phone || !address || !city) {
      setDeliveryError("Please fill in all required delivery fields.");
      return;
    }

    setDeliveryError("");
    setLoading(true);

    const idempotencyKey = getOrCreateCheckoutIdempotencyKey(cartFingerprint);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify({ name, email, phone, address, city, items, saveAddress }),
      });
      const data = await response.json();

      if (data.success === true) {
        const placedTotal =
          typeof data.order?.total === "number" ? data.order.total : total;
        setTrackingId(data.trackingId);
        setOrderTotal(placedTotal);
        reportPurchase(data.trackingId, placedTotal);
        clearCart();
        clearCheckoutIdempotencyKey(cartFingerprint);
        setStep(2);
      } else if (data.proxyError === true) {
        const recovery = await fetch(
          `/api/orders?idempotencyKey=${encodeURIComponent(idempotencyKey)}`
        ).then((r) => r.json());
        if (recovery.success === true && recovery.trackingId) {
          const placedTotal =
            typeof recovery.order?.total === "number" ? recovery.order.total : total;
          setTrackingId(recovery.trackingId);
          setOrderTotal(placedTotal);
          reportPurchase(recovery.trackingId, placedTotal);
          clearCart();
          clearCheckoutIdempotencyKey(cartFingerprint);
          setStep(2);
        } else {
          alert(data.message || "Checkout failed. Please try again.");
        }
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
      `\n\nTotal: ${formatPrice(total)}`,
    whatsappNumber
  );

  if (!hydrated && step !== 2) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p role="status" className="text-sm font-medium text-neutral-600">Loading checkout…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <DemoModeBanner className="mb-8" />

        {step === 1 && (
          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
            <form onSubmit={handlePlaceOrder} className={`${raisedSurface} space-y-6 p-6 md:p-8 lg:col-span-7`}>
              <h1 className={`border-b border-[#DCE0E7] pb-4 ${panelHeading} text-xl`}>Delivery details</h1>

              {deliveryError && (
                <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
                  {deliveryError}
                </p>
              )}

              <div className="space-y-4">
                <div>
                  <label htmlFor="checkout-name" className={fieldLabel}>Full name *</label>
                  <input
                    id="checkout-name"
                    type="text"
                    autoComplete="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className={fieldInput}
                  />
                </div>
                {/* Stacked on a phone: side by side at 360px each field was
                    120px wide and clipped its own placeholder. */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="checkout-email" className={fieldLabel}>Email address *</label>
                    <input
                      id="checkout-email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@domain.com"
                      className={fieldInput}
                    />
                  </div>
                  <div>
                    <label htmlFor="checkout-phone" className={fieldLabel}>Phone number *</label>
                    <input
                      id="checkout-phone"
                      type="tel"
                      autoComplete="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+254 700 000 000"
                      className={fieldInput}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="checkout-address" className={fieldLabel}>Physical address *</label>
                  <input
                    id="checkout-address"
                    type="text"
                    autoComplete="street-address"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Apartment suite, street address"
                    className={fieldInput}
                  />
                </div>
                <div>
                  <label htmlFor="checkout-city" className={fieldLabel}>City *</label>
                  <input
                    id="checkout-city"
                    type="text"
                    autoComplete="address-level2"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Nairobi, Mombasa"
                    className={fieldInput}
                  />
                </div>
              </div>

              {isLoggedIn && (
                <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-neutral-700">
                  <input
                    type="checkbox"
                    checked={saveAddress}
                    onChange={(e) => setSaveAddress(e.target.checked)}
                    className={fieldCheckbox}
                  />
                  Save this address to my account
                </label>
              )}

              <p className="text-sm leading-relaxed text-neutral-600">
                Payment is arranged after you order — we&apos;ll call or WhatsApp you to confirm
                delivery and payment details. Pay by M-Pesa, bank transfer, or cash on delivery
                within Nairobi; nothing is charged on this site yet.
              </p>

              <button
                type="submit"
                disabled={loading}
                className={`${primaryButton} h-12 w-full active:scale-[0.98]`}
              >
                {loading ? "Placing order..." : "Place order"} <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </button>
              <p className="text-center text-xs text-neutral-600">
                By placing an order you agree to our{" "}
                <Link href="/privacy-policy" className={textLink}>
                  Privacy Policy
                </Link>
                .
              </p>
            </form>

            <div className="space-y-6 lg:col-span-5">
              <div className={`${raisedSurface} p-6`}>
                <div className="flex items-center justify-between border-b border-[#DCE0E7] pb-3">
                  <h2 className={panelHeading}>Your order summary</h2>
                  <Link
                    href="/cart"
                    className={`-mr-2 inline-flex min-h-11 items-center rounded-full px-2 text-sm font-semibold text-[#8f4710] hover:underline ${focusRing}`}
                  >
                    Edit cart
                  </Link>
                </div>
                <div className="max-h-56 divide-y divide-[#DCE0E7] overflow-y-auto py-2">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-2 py-3">
                      <span className="truncate pr-3 text-sm text-neutral-700">
                        {item.name} <span className="text-xs font-semibold text-neutral-600">x{item.qty}</span>
                      </span>
                      <span className="shrink-0 text-sm font-semibold tabular-nums text-neutral-950">
                        {formatPrice(item.price * item.qty)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex items-baseline justify-between border-t border-[#DCE0E7] pt-4">
                  <span className="text-base font-semibold text-neutral-950">Order total</span>
                  <span className="text-2xl font-semibold tabular-nums text-neutral-950">{formatPrice(total)}</span>
                </div>
              </div>

              <div className={`${raisedSurface} p-6`}>
                <h2 className={`border-b border-[#DCE0E7] pb-3 ${panelHeading}`}>Prefer WhatsApp?</h2>
                <p className="mt-3 text-sm leading-relaxed text-neutral-600">
                  Send your order directly and our team will confirm availability and delivery.
                </p>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={`${secondaryButton} mt-4 w-full active:scale-[0.98]`}
                >
                  <PhoneCall aria-hidden="true" className="h-4 w-4" /> Order on WhatsApp
                </a>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className={`${raisedSurface} mx-auto max-w-md px-6 py-12 text-center sm:px-8`}>
            <CheckCircle aria-hidden="true" className="mx-auto mb-6 h-14 w-14 stroke-[1.25] text-emerald-700" />
            <h1 className="text-2xl font-medium tracking-tight text-neutral-950 md:text-3xl">Order placed!</h1>
            <p className="mt-2 text-base leading-relaxed text-neutral-600">
              Thanks, <span className="font-semibold text-neutral-950">{name}</span>. We&apos;ve saved your order and will be in touch soon.
            </p>

            {SITE.demoMode && <DemoModeBanner variant="checkout-success" className="mt-4" />}

            <dl className="my-8 space-y-2 rounded-xl border border-[#DCE0E7] bg-[#F6F7F9] p-5 text-left text-sm text-neutral-700">
              <div className="flex justify-between gap-4">
                <dt>Name</dt>
                <dd className="font-semibold text-neutral-950">{name}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Order reference</dt>
                <dd className="font-mono font-bold tracking-wider text-[#8f4710]">{trackingId}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Delivery</dt>
                <dd className="max-w-[200px] truncate font-semibold text-neutral-950">{address}, {city}</dd>
              </div>
              <div className="mt-2 flex justify-between gap-4 border-t border-[#DCE0E7] pt-2">
                <dt>Total</dt>
                <dd className="font-semibold tabular-nums text-neutral-950">{formatPrice(orderTotal)}</dd>
              </div>
            </dl>

            <p className="mx-auto mb-6 max-w-xs text-sm leading-relaxed text-neutral-600">
              Save your reference <span className="font-mono font-bold text-neutral-950">{trackingId}</span> to
              track status anytime. We&apos;ll call you to confirm your order.
            </p>

            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link href={`/track-order?id=${encodeURIComponent(trackingId)}`} className={primaryButton}>
                Track order
              </Link>
              {isLoggedIn && (
                <Link href="/account/orders" className={secondaryButton}>
                  My orders
                </Link>
              )}
              <Link href="/" className={secondaryButton}>
                Return home
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
