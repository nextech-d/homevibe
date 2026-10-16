import Link from "next/link";
import { redirect } from "next/navigation";
import { formatPrice } from "../../lib/formatPrice";
import { panelHeading, raisedSurface, textLink } from "../../components/homeSurfaces";
import { getCurrentUser, listOrdersForUser, listUserAddresses } from "../../lib/users.server";

export default async function AccountOverviewPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/account/login");

  const [orders, addresses] = await Promise.all([
    listOrdersForUser(user.id),
    listUserAddresses(user.id),
  ]);

  return (
    <div className="space-y-8">
      <section className={`${raisedSurface} p-6`}>
        <h2 className={panelHeading}>Recent orders</h2>
        {orders.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-600">No orders yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-[#DCE0E7]">
            {orders.slice(0, 3).map((order) => (
              <li key={order.trackingId} className="flex justify-between py-3 text-sm">
                <span className="font-mono font-semibold text-[#8f4710]">{order.trackingId}</span>
                <span className="font-semibold tabular-nums text-neutral-950">{formatPrice(order.total)}</span>
              </li>
            ))}
          </ul>
        )}
        <Link href="/account/orders" className={`mt-2 inline-flex min-h-11 items-center text-sm ${textLink}`}>
          View all orders →
        </Link>
      </section>

      <section className={`${raisedSurface} p-6`}>
        <h2 className={panelHeading}>Saved addresses</h2>
        {addresses.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-600">No saved addresses yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {addresses.slice(0, 2).map((addr) => (
              <li key={addr.id} className="text-sm text-neutral-700">
                <span className="font-semibold text-neutral-950">{addr.label}</span>
                {addr.isDefault && (
                  <span className="ml-2 rounded-full bg-[#F6F7F9] px-2 py-0.5 text-xs font-semibold text-neutral-800 ring-1 ring-[#DCE0E7]">Default</span>
                )}
                <p className="mt-0.5">{addr.addressLine}, {addr.city}</p>
              </li>
            ))}
          </ul>
        )}
        <Link href="/account/addresses" className={`mt-2 inline-flex min-h-11 items-center text-sm ${textLink}`}>
          Manage addresses →
        </Link>
      </section>
    </div>
  );
}
