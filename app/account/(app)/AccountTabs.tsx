"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { chip, chipActive } from "../../components/homeSurfaces";

const TABS = [
  { href: "/account", label: "Overview" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/addresses", label: "Addresses" },
] as const;

/** The account's three tabs. Client-side only to know which one you're on. */
export default function AccountTabs() {
  const pathname = usePathname();
  return (
    <nav aria-label="Account">
      <ul className="flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const current = pathname === tab.href;
          return (
            <li key={tab.href}>
              <Link href={tab.href} aria-current={current ? "page" : undefined} className={current ? chipActive : chip}>
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
