import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Search,
  RefreshCw,
  Download,
  Copy,
  Check,
  ExternalLink,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  ShoppingBag,
} from "lucide-react";
import { api, exportOrdersCsv, formatKes, STORE_URL } from "../lib/api";
import {
  CatalogStatTile,
  StorefrontSection,
  storefrontInputClass,
  storefrontSelectClass,
} from "../components/StorefrontPanel";

type OrderItem = {
  id: number;
  name: string;
  price: number;
  qty: number;
  /** The options chosen, as stored when the order was placed; [] for none. */
  options?: { type: string; value: string }[];
};
type Order = {
  id: number;
  trackingId: string;
  orderDate: string;
  status: string;
  statusKey: string;
  paymentStatus: string;
  paymentStatusKey: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  deliveryCity: string;
  total: number;
  items: OrderItem[];
};

/** "Length: 45M, Color: Red" - the item's chosen options, or "". */
function optionsText(item: OrderItem): string {
  return (item.options ?? []).map((option) => `${option.type}: ${option.value}`).join(", ");
}

type Summary = {
  total: number;
  filtered: number;
  revenueFiltered: number;
  pendingPayments: number;
};

const STATUS_OPTS = [
  { value: "", label: "All statuses" },
  { value: "confirmed", label: "Confirmed" },
  { value: "preparing", label: "Preparing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
] as const;

const PAYMENT_OPTS = [
  { value: "", label: "All payments" },
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "refunded", label: "Refunded" },
] as const;

const QUICK_FILTERS = [
  { key: "all", label: "All", payment: "", status: "", excludePending: false },
  { key: "pending", label: "Unpaid", payment: "pending", status: "", excludePending: false },
  {
    key: "confirmed",
    label: "Confirmed",
    payment: "",
    status: "confirmed",
    excludePending: true,
  },
  {
    key: "preparing",
    label: "Preparing",
    payment: "",
    status: "preparing",
    excludePending: true,
  },
  { key: "shipped", label: "Shipped", payment: "", status: "shipped", excludePending: true },
] as const;

function whatsAppUrl(phone: string, text: string): string {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export default function OrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState(searchParams.get("q") ?? "");

  const statusFilter = searchParams.get("status") ?? "";
  const paymentFilter = searchParams.get("payment") ?? "";
  const excludePending = searchParams.get("excludePending") === "1";

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (paymentFilter) params.set("payment", paymentFilter);
    if (excludePending) params.set("excludePending", "1");
    const q = searchParams.get("q");
    if (q) params.set("q", q);
    const s = params.toString();
    return s ? `?${s}` : "";
  }, [statusFilter, paymentFilter, excludePending, searchParams]);

  const load = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError("");
      try {
        const data = await api<{ orders: Order[]; summary: Summary }>(
          `/admin/orders${queryString}`
        );
        setOrders(data.orders);
        setSummary(data.summary);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load orders");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [queryString]
  );

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        const trimmed = searchInput.trim();
        if (trimmed) next.set("q", trimmed);
        else next.delete("q");
        return next;
      });
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput, setSearchParams]);

  function applyFilters(opts: {
    status: string;
    payment: string;
    excludePending: boolean;
  }) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (opts.status) next.set("status", opts.status);
      else next.delete("status");
      if (opts.payment) next.set("payment", opts.payment);
      else next.delete("payment");
      if (opts.excludePending) next.set("excludePending", "1");
      else next.delete("excludePending");
      return next;
    });
  }

  async function patchOrder(
    trackingId: string,
    updates: { status?: string; paymentStatus?: string }
  ) {
    setSavingId(trackingId);
    try {
      const data = await api<{ order: Order }>("/admin/orders", {
        method: "PATCH",
        body: JSON.stringify({ trackingId, ...updates }),
      });
      setOrders((prev) => prev.map((o) => (o.trackingId === trackingId ? data.order : o)));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Update failed");
    } finally {
      setSavingId(null);
    }
  }

  async function copyReference(trackingId: string) {
    await navigator.clipboard.writeText(trackingId);
    setCopiedId(trackingId);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const activeQuick =
    QUICK_FILTERS.find(
      (f) =>
        f.status === statusFilter &&
        f.payment === paymentFilter &&
        f.excludePending === excludePending
    )?.key ?? "custom";

  return (
    <div className="p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-white">Orders</h1>
          <p className="mt-1 text-sm text-neutral-500">Manage delivery and payment status</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => load(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#333] px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-neutral-400 hover:text-white disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => exportOrdersCsv().catch((e) => alert(e.message))}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#333] px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-neutral-300 hover:bg-[#1a1a1a]"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      <StorefrontSection
        className="mt-6"
        title="Overview"
        description="Order volume and revenue"
        icon={ShoppingBag}
        accent="green"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {loading && !summary ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-24 animate-pulse rounded-xl border border-[#333] bg-[#161616]"
              />
            ))
          ) : (
            <>
              <CatalogStatTile
                label="Total orders"
                value={summary?.total ?? 0}
                icon={ShoppingBag}
                accent="green"
              />
              <CatalogStatTile
                label="Shown"
                value={summary?.filtered ?? 0}
                icon={ShoppingBag}
                accent="sky"
              />
              <CatalogStatTile
                label="Filtered revenue"
                value={formatKes(summary?.revenueFiltered ?? 0)}
                icon={ShoppingBag}
                accent="violet"
                valueClassName="text-[#00e599] text-xl"
              />
              <CatalogStatTile
                label="Unpaid"
                value={summary?.pendingPayments ?? 0}
                icon={ShoppingBag}
                accent="amber"
                valueClassName="text-amber-400"
              />
            </>
          )}
        </div>
      </StorefrontSection>

      <StorefrontSection
        className="mt-6"
        title="Filters"
        description="Quick filters, search, status, and payment."
        icon={Search}
        accent="violet"
      >
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            {QUICK_FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() =>
                  applyFilters({
                    status: f.status,
                    payment: f.payment,
                    excludePending: f.excludePending,
                  })
                }
                className={`rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition ${
                  activeQuick === f.key
                    ? "bg-[#00e599]/15 text-[#00e599]"
                    : "bg-[#111] text-neutral-500 hover:text-neutral-300"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[200px] flex-1 max-w-lg">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-600" />
              <input
                type="search"
                placeholder="Search reference, name, email, phone, city…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className={`${storefrontInputClass} pl-10`}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) =>
                applyFilters({
                  status: e.target.value,
                  payment: paymentFilter,
                  excludePending: false,
                })
              }
              className={`${storefrontSelectClass} w-full min-w-[140px] max-w-xs sm:w-44`}
            >
              {STATUS_OPTS.map((o) => (
                <option key={o.label} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <select
              value={paymentFilter}
              onChange={(e) =>
                applyFilters({
                  status: statusFilter,
                  payment: e.target.value,
                  excludePending: false,
                })
              }
              className={`${storefrontSelectClass} w-full min-w-[140px] max-w-xs sm:w-44`}
            >
              {PAYMENT_OPTS.map((o) => (
                <option key={o.label} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </StorefrontSection>

      {error && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3">
          <p className="text-sm text-red-400">{error}</p>
          <button type="button" onClick={() => load()} className="text-xs text-red-300">
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <StorefrontSection
          className="mt-6"
          title="All orders"
          description="Loading orders…"
          icon={ShoppingBag}
          accent="amber"
        >
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-[#161616]" />
            ))}
          </div>
        </StorefrontSection>
      ) : orders.length === 0 ? (
        <StorefrontSection
          className="mt-6"
          title="All orders"
          description="No matching orders"
          icon={ShoppingBag}
          accent="amber"
        >
          <p className="rounded-xl border border-[#262626] bg-[#0a0a0a] p-10 text-center text-sm text-neutral-500">
            {searchInput || statusFilter || paymentFilter
              ? "No orders match your filters."
              : "No orders yet."}
          </p>
        </StorefrontSection>
      ) : (
        <StorefrontSection
          className="mt-6"
          title="All orders"
          description={
            summary ? `${summary.filtered} of ${summary.total} shown` : "Browse and manage orders"
          }
          icon={ShoppingBag}
          accent="amber"
          badge={summary ? String(summary.filtered) : undefined}
        >
          <div className="overflow-hidden rounded-xl border border-[#262626]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#111111] text-[10px] uppercase tracking-wider text-neutral-600">
              <tr>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3 hidden md:table-cell">Customer</th>
                <th className="px-4 py-3 hidden lg:table-cell">Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#262626] bg-[#0a0a0a]">
              {orders.map((order) => {
                const isOpen = expanded === order.id;
                return (
                  <Fragment key={order.id}>
                    <tr
                      className="text-neutral-300 hover:bg-[#111111]/60 cursor-pointer"
                      onClick={() => setExpanded(isOpen ? null : order.id)}
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono font-bold text-[#00e599]">{order.trackingId}</span>
                        <p className="mt-0.5 text-[10px] text-neutral-600 md:hidden">
                          {order.customerName}
                        </p>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <p className="font-medium text-white">{order.customerName}</p>
                        <p className="text-[10px] text-neutral-600">{order.deliveryCity}</p>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-neutral-500">
                        {new Date(order.orderDate).toLocaleString("en-KE", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </td>
                      <td className="px-4 py-3 text-neutral-400">{order.status}</td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            order.paymentStatusKey === "paid"
                              ? "text-[#00e599]"
                              : order.paymentStatusKey === "refunded"
                                ? "text-red-400"
                                : "text-amber-500"
                          }
                        >
                          {order.paymentStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-white">
                        {formatKes(order.total)}
                      </td>
                      <td className="px-4 py-3 text-neutral-600">
                        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </td>
                    </tr>
                    {isOpen && (
                      <tr key={`${order.id}-detail`} className="bg-[#111111]">
                        <td colSpan={7} className="px-4 py-5">
                          <OrderDetail
                            order={order}
                            saving={savingId === order.trackingId}
                            copied={copiedId === order.trackingId}
                            onCopy={() => copyReference(order.trackingId)}
                            onPatch={(updates) => patchOrder(order.trackingId, updates)}
                          />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
          </div>
        </StorefrontSection>
      )}
    </div>
  );
}

function OrderDetail({
  order,
  saving,
  copied,
  onCopy,
  onPatch,
}: {
  order: Order;
  saving: boolean;
  copied: boolean;
  onCopy: () => void;
  onPatch: (u: { status?: string; paymentStatus?: string }) => void;
}) {
  const trackUrl = `${STORE_URL}/track-order?id=${encodeURIComponent(order.trackingId)}`;
  const waUrl = whatsAppUrl(
    order.customerPhone,
    `Hi ${order.customerName}, regarding your HomeVibe order ${order.trackingId}.`
  );

  return (
    <div className="space-y-4" onClick={(e) => e.stopPropagation()}>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#333] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-400 hover:text-white"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy ref"}
        </button>
        <a
          href={trackUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#333] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-400 hover:text-white"
        >
          <ExternalLink className="h-3 w-3" /> Track
        </a>
        <a
          href={waUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#333] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-400 hover:text-[#00e599]"
        >
          <MessageCircle className="h-3 w-3" /> WhatsApp
        </a>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-xs">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-neutral-600">Email</p>
          <p className="mt-1 text-neutral-300">{order.customerEmail}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-neutral-600">Phone</p>
          <p className="mt-1 text-neutral-300">{order.customerPhone}</p>
        </div>
        <div className="sm:col-span-2">
          <p className="text-[10px] uppercase tracking-wider text-neutral-600">Delivery</p>
          <p className="mt-1 text-neutral-300">
            {order.deliveryAddress}, {order.deliveryCity}
          </p>
        </div>
      </div>

      <div>
        <p className="text-[10px] uppercase tracking-wider text-neutral-600 mb-2">Line items</p>
        <ul className="divide-y divide-[#262626] rounded-lg border border-[#262626]">
          {order.items.map((item) => (
            <li
              key={`${order.id}-${item.id}-${item.name}-${optionsText(item)}`}
              className="flex justify-between gap-4 px-4 py-2.5"
            >
              <span>
                {item.name} <span className="text-neutral-600">× {item.qty}</span>
                {optionsText(item) && (
                  <span className="mt-0.5 block text-xs text-neutral-400">{optionsText(item)}</span>
                )}
              </span>
              <span className="font-medium text-white">{formatKes(item.price * item.qty)}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-wrap items-center gap-4 pt-2">
        <label className="flex items-center gap-2 text-neutral-500">
          Delivery
          <select
            value={order.statusKey}
            disabled={saving}
            onChange={(e) => onPatch({ status: e.target.value })}
            className="rounded-lg border border-[#333] bg-[#0a0a0a] px-3 py-2 text-white disabled:opacity-50"
          >
            {STATUS_OPTS.filter((o) => o.value).map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-neutral-500">
          Payment
          <select
            value={order.paymentStatusKey}
            disabled={saving}
            onChange={(e) => onPatch({ paymentStatus: e.target.value })}
            className="rounded-lg border border-[#333] bg-[#0a0a0a] px-3 py-2 text-white disabled:opacity-50"
          >
            {PAYMENT_OPTS.filter((o) => o.value).map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        {saving && (
          <span className="text-[10px] uppercase tracking-wider text-neutral-600">Saving…</span>
        )}
      </div>
    </div>
  );
}
