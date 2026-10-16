import Link from "next/link";
import { redirect } from "next/navigation";
import { formatPrice } from "../../../lib/formatPrice";
import { panelHeading, raisedSurface, textLink } from "../../../components/homeSurfaces";
import { getCurrentUser, listOrdersForUser } from "../../../lib/users.server";

const STATUS_LABELS: Record<string, string> = {
  confirmed: "Confirmed",
  preparing: "Preparing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const PAYMENT_LABELS: Record<string, string> = {
  pending: "Payment pending",
  paid: "Paid",
  refunded: "Refunded",
};

export default async function AccountOrdersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/account/login");

  const orders = await listOrdersForUser(user.id);

  return (
    <div>
      <h2 className={`${panelHeading} text-xl`}>Order history</h2>
      {orders.length === 0 ? (
        <p className="mt-4 text-sm text-neutral-600">You haven&apos;t placed any orders yet.</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {orders.map((order) => (
            <li key={order.trackingId} className={`${raisedSurface} p-5`}>
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="font-mono font-bold text-[#8f4710]">{order.trackingId}</span>
                <Link
                  href={`/track-order?id=${encodeURIComponent(order.trackingId)}`}
                  className={`inline-flex min-h-11 items-center ${textLink}`}
                >
                  Track status →
                </Link>
              </div>
              <p className="mt-1 text-sm font-medium text-neutral-700">
                {STATUS_LABELS[order.status] ?? order.status}
                <span aria-hidden="true" className="mx-2 text-neutral-500">·</span>
                {PAYMENT_LABELS[order.paymentStatus] ?? order.paymentStatus}
                <span aria-hidden="true" className="mx-2 text-neutral-500">·</span>
                {new Date(order.orderDate).toLocaleDateString("en-KE")}
              </p>
              <ul className="mt-3 divide-y divide-[#DCE0E7] text-sm text-neutral-700">
                {order.items.map((item) => (
                  <li key={`${order.trackingId}-${item.name}`} className="flex justify-between py-2">
                    <span>{item.name} × {item.qty}</span>
                    <span>{formatPrice(item.price * item.qty)}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-right text-sm font-semibold tabular-nums text-neutral-950">
                Total {formatPrice(order.total)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
