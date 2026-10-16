"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Package, Search, Copy, Check } from "lucide-react";
import { formatPrice } from "../lib/formatPrice";
import DemoModeBanner from "../components/DemoModeBanner";
import WhatsAppIcon from "../components/WhatsAppIcon";
import { useWhatsAppNumber } from "../context/WhatsAppContext";
import { buildWhatsAppUrl } from "../lib/whatsapp";
import {
  fieldInput,
  focusRing,
  pageHeading,
  primaryButton,
  raisedSurface,
  textLink,
} from "../components/homeSurfaces";

const resultLabel = "text-sm text-neutral-600";

type OrderItem = {
  id: number;
  name: string;
  price: number;
  qty: number;
  image: string;
};

type TrackedOrder = {
  trackingId: string;
  orderDate: string;
  status: string;
  paymentStatus: string;
  total: number;
  customer: {
    name: string;
    city: string;
  };
  items: OrderItem[];
};

export default function TrackOrderPage() {
  return (
    <Suspense>
      <TrackOrderContent />
    </Suspense>
  );
}

function TrackOrderContent() {
  const searchParams = useSearchParams();
  // Links from the confirmation email, checkout and the account page carry
  // the reference. The phone number has to be typed - it's what proves the
  // order is yours - so the page fills in the reference and waits there.
  const linkedId = searchParams.get("id") ?? "";
  const [trackingId, setTrackingId] = useState(linkedId);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [copied, setCopied] = useState(false);
  const phoneRef = useRef<HTMLInputElement>(null);
  // The admin-set number the footer and checkout dial.
  const whatsappNumber = useWhatsAppNumber();

  useEffect(() => {
    if (linkedId) phoneRef.current?.focus();
  }, [linkedId]);

  async function lookupOrder(rawId: string, rawPhone: string) {
    const id = rawId.trim().toUpperCase();
    const enteredPhone = rawPhone.trim();
    if (!id || !enteredPhone) {
      setError("Please enter your order reference and the phone number you ordered with.");
      setOrder(null);
      return;
    }

    setLoading(true);
    setError("");
    setOrder(null);

    try {
      // The phone goes in a header, so it stays out of URLs and request logs.
      const res = await fetch(`/api/orders?trackingId=${encodeURIComponent(id)}`, {
        headers: { "X-Order-Phone": enteredPhone },
      });
      const data = (await res.json()) as {
        success: boolean;
        message?: string;
        order?: TrackedOrder;
      };

      if (!res.ok || !data.success || !data.order) {
        setError(
          data.message ?? "We couldn't find an order with that reference and phone number."
        );
        return;
      }

      setOrder(data.order);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await lookupOrder(trackingId, phone);
  };

  async function copyReference() {
    if (!order) return;
    await navigator.clipboard.writeText(order.trackingId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen pb-24">
      <div className="mx-auto max-w-2xl px-6 py-10">
        <Link
          href="/"
          className={`-ml-1 inline-flex min-h-11 items-center gap-2 rounded-full px-1 text-sm font-medium text-neutral-700 transition hover:text-neutral-950 ${focusRing}`}
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Back to home
        </Link>

        <DemoModeBanner variant="track-order" className="mb-8 mt-6" />

        <div className="mt-4 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#a85414] text-white">
            <Package aria-hidden="true" className="h-7 w-7" />
          </div>
          <h1 className={`mt-5 ${pageHeading}`}>Track your order</h1>
          <p className="mx-auto mt-3 max-w-lg text-base leading-relaxed text-neutral-600">
            Enter the order reference from your confirmation (e.g. PTL-123456) and the phone
            number you placed the order with.
          </p>
        </div>

        <form onSubmit={handleSubmit} className={`${raisedSurface} mt-8 p-4 sm:p-5`}>
          <div className="flex flex-col gap-3 sm:flex-row">
            <label htmlFor="trackingId" className="sr-only">
              Order reference
            </label>
            <input
              id="trackingId"
              type="text"
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
              placeholder="PTL-123456"
              autoComplete="off"
              className={`${fieldInput} min-w-0 flex-1`}
            />
            <label htmlFor="orderPhone" className="sr-only">
              Phone number used on the order
            </label>
            <input
              id="orderPhone"
              ref={phoneRef}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone, e.g. 0712 345 678"
              className={`${fieldInput} min-w-0 flex-1`}
            />
            <button
              type="submit"
              disabled={loading}
              className={`${primaryButton} shrink-0`}
            >
              <Search aria-hidden="true" className="h-4 w-4" />
              {loading ? "Searching…" : "Track"}
            </button>
          </div>
        </form>

        {error && (
          <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
            {error}
          </p>
        )}

        {order && (
          <div className={`${raisedSurface} mt-8 overflow-hidden`}>
            <div className="border-b border-[#DCE0E7] bg-[#F6F7F9] px-6 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className={resultLabel}>Order reference</p>
                  <p className="mt-1 font-mono text-lg font-bold text-neutral-950">{order.trackingId}</p>
                </div>
                <button
                  type="button"
                  onClick={copyReference}
                  className={`inline-flex min-h-11 items-center gap-1.5 rounded-full border border-[#DCE0E7] bg-white px-4 text-sm font-medium text-neutral-800 transition-colors hover:border-[#a85414] ${focusRing}`}
                >
                  {copied ? <Check aria-hidden="true" className="h-4 w-4" /> : <Copy aria-hidden="true" className="h-4 w-4" />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            <div className="grid gap-4 px-6 py-5 sm:grid-cols-2">
              <div>
                <p className={resultLabel}>Status</p>
                <p className="mt-1 text-base font-semibold text-emerald-800">{order.status}</p>
              </div>
              <div>
                <p className={resultLabel}>Payment</p>
                <p
                  className={`mt-1 text-base font-semibold ${
                    order.paymentStatus === "Paid" ? "text-emerald-800" : "text-amber-800"
                  }`}
                >
                  {order.paymentStatus}
                </p>
              </div>
              <div>
                <p className={resultLabel}>Order date</p>
                <p className="mt-1 text-base font-semibold text-neutral-950">
                  {new Date(order.orderDate).toLocaleDateString("en-KE", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div>
                <p className={resultLabel}>Customer</p>
                <p className="mt-1 text-base font-semibold text-neutral-950">{order.customer.name}</p>
                <p className="text-sm text-neutral-600">{order.customer.city}</p>
              </div>
              <div>
                <p className={resultLabel}>Total</p>
                <p className="mt-1 text-base font-semibold tabular-nums text-neutral-950">
                  {formatPrice(order.total)}
                </p>
              </div>
            </div>

            <div className="border-t border-[#DCE0E7] px-6 py-5">
              <p className={resultLabel}>Items</p>
              <ul className="mt-3 space-y-3">
                {order.items.map((item) => (
                  <li
                    key={`${item.id}-${item.name}`}
                    className="flex items-center justify-between gap-4 text-sm"
                  >
                    <span className="font-medium text-neutral-950">
                      {item.name}{" "}
                      <span className="text-neutral-600">× {item.qty}</span>
                    </span>
                    <span className="shrink-0 font-semibold tabular-nums text-neutral-950">
                      {formatPrice(item.price * item.qty)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-[#DCE0E7] bg-[#F6F7F9] px-6 py-3 text-center">
              <p className="text-sm text-neutral-600">
                Questions about your order?{" "}
                {/* Opens a chat with the shop, the reference already typed. It
                    used to link to the homepage. */}
                <a
                  href={buildWhatsAppUrl(
                    `Hi HomeVibe, I have a question about my order ${order.trackingId}.`,
                    whatsappNumber
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex min-h-11 items-center gap-1.5 ${textLink}`}
                >
                  <WhatsAppIcon className="h-4 w-4" />
                  Contact us via WhatsApp
                </a>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
