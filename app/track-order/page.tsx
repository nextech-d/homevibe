"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Package, Search, Copy, Check } from "lucide-react";
import { formatPrice } from "../lib/formatPrice";
import DemoModeBanner from "../components/DemoModeBanner";

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
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="mx-auto max-w-2xl px-6 py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-500 transition hover:text-black"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <DemoModeBanner variant="track-order" className="mb-8 mt-6" />

        <div className="mt-4 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-900 text-white">
            <Package className="h-7 w-7" />
          </div>
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-black">Track your order</h1>
          <p className="mt-2 text-sm text-black/60">
            Enter the order reference from your confirmation (e.g. PTL-123456) and the phone
            number you placed the order with.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-10">
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
              className="min-w-0 flex-1 rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black/20"
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
              className="min-w-0 flex-1 rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black/20"
            />
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-900 px-6 py-3 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-black disabled:opacity-50"
            >
              <Search className="h-4 w-4" />
              {loading ? "Searching…" : "Track"}
            </button>
          </div>
        </form>

        {error && (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {order && (
          <div className="mt-8 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
            <div className="border-b border-neutral-100 bg-neutral-50 px-6 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                    Order reference
                  </p>
                  <p className="mt-1 font-mono text-lg font-bold text-black">{order.trackingId}</p>
                </div>
                <button
                  type="button"
                  onClick={copyReference}
                  className="inline-flex items-center gap-1 rounded-full border border-neutral-200 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-600 hover:border-neutral-400"
                >
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            <div className="grid gap-4 px-6 py-5 sm:grid-cols-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                  Status
                </p>
                <p className="mt-1 text-sm font-semibold text-emerald-700">{order.status}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                  Payment
                </p>
                <p
                  className={`mt-1 text-sm font-semibold ${
                    order.paymentStatus === "Paid" ? "text-emerald-700" : "text-amber-700"
                  }`}
                >
                  {order.paymentStatus}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                  Order date
                </p>
                <p className="mt-1 text-sm font-semibold text-black">
                  {new Date(order.orderDate).toLocaleDateString("en-KE", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                  Customer
                </p>
                <p className="mt-1 text-sm font-semibold text-black">{order.customer.name}</p>
                <p className="text-xs text-neutral-500">{order.customer.city}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                  Total
                </p>
                <p className="mt-1 text-sm font-bold tabular-nums text-black">
                  {formatPrice(order.total)}
                </p>
              </div>
            </div>

            <div className="border-t border-neutral-100 px-6 py-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                Items
              </p>
              <ul className="mt-3 space-y-3">
                {order.items.map((item) => (
                  <li
                    key={`${item.id}-${item.name}`}
                    className="flex items-center justify-between gap-4 text-sm"
                  >
                    <span className="font-medium text-neutral-900">
                      {item.name}{" "}
                      <span className="text-neutral-500">× {item.qty}</span>
                    </span>
                    <span className="shrink-0 font-semibold tabular-nums text-neutral-900">
                      {formatPrice(item.price * item.qty)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-neutral-100 bg-neutral-50 px-6 py-4 text-center">
              <p className="text-xs text-neutral-500">
                Questions about your order?{" "}
                <Link href="/" className="font-semibold text-neutral-900 hover:underline">
                  Contact us via WhatsApp
                </Link>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
