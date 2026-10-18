"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Phone, Search, ShoppingBag, X } from "lucide-react";
import { SITE } from "../config/site";
import { useCart } from "../context/CartContext";
import { useSiteSettings } from "../context/StorefrontContext";
import SearchPopover from "./SearchPopover";
import NavMenu from "./NavMenu";
import { CART_INTENT_ATTRIBUTE } from "./cartUiLoaders";
import MobileNav from "./MobileNav";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a85414]";

/** A round 44px icon button: the touch target the header's actions share. */
const iconButton = `relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-neutral-900 transition-colors hover:bg-neutral-100 ${focusRing}`;

function BrandLink() {
  return (
    <Link
      href="/"
      aria-label={`${SITE.name} home`}
      className={`flex min-h-11 min-w-0 shrink-0 items-center gap-2 rounded-lg sm:gap-2.5 ${focusRing}`}
    >
      <Image
        src="/logo.png"
        alt=""
        width={250}
        height={250}
        className="h-9 w-9 shrink-0 lg:h-10 lg:w-10"
        priority
      />
      <span className="text-lg font-black tracking-tight text-neutral-950 lg:text-[22px]">
        HomeVibe
      </span>
    </Link>
  );
}

/**
 * Two tiers on desktop - brand, search, phone and cart on top, categories
 * underneath - both inside the one sticky header, so every menu stays in reach
 * however far down the page you are. Nothing changes size on scroll, so there
 * is nothing to jump.
 *
 * Below lg the categories live in the menu drawer; below sm the search sits
 * behind an icon and opens as a row under the bar.
 */
export default function Header() {
  const { items, setCartOpen } = useCart();
  const site = useSiteSettings();
  const pathname = usePathname();
  const cartCount = items.reduce((c, i) => c + i.qty, 0);
  // Open on the page it was opened on: following a result closes it.
  const [searchOpenOn, setSearchOpenOn] = useState<string | null>(null);
  const mobileSearchOpen = searchOpenOn === pathname;
  const setMobileSearchOpen = (open: boolean) => setSearchOpenOn(open ? pathname : null);

  const tel = `tel:${site.phone.replace(/\s/g, "")}`;

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-neutral-200/80 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center gap-2 sm:gap-4 lg:h-[72px] lg:gap-8">
            <BrandLink />

            <div className="mx-auto hidden w-full min-w-0 max-w-2xl sm:block">
              <SearchPopover />
            </div>

            <div className="ml-auto flex shrink-0 items-center gap-1 sm:ml-0">
              <button
                type="button"
                onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
                aria-expanded={mobileSearchOpen}
                aria-label={mobileSearchOpen ? "Close search" : "Search"}
                className={`${iconButton} sm:hidden`}
              >
                {mobileSearchOpen ? (
                  <X aria-hidden="true" className="h-5 w-5" />
                ) : (
                  <Search aria-hidden="true" className="h-5 w-5" />
                )}
              </button>

              <a
                href={tel}
                aria-label={`Call ${site.phone}`}
                className={`hidden h-11 items-center gap-2 rounded-full px-3 text-sm font-semibold text-neutral-900 transition-colors hover:bg-neutral-100 lg:flex ${focusRing}`}
              >
                <Phone aria-hidden="true" className="h-4 w-4 text-[#a85414]" />
                <span className="hidden tabular-nums xl:inline">{site.phone}</span>
              </a>

              <span aria-hidden="true" className="mx-1 hidden h-6 w-px bg-neutral-200 lg:block" />

              <button
                type="button"
                onClick={() => setCartOpen(true)}
                {...{ [CART_INTENT_ATTRIBUTE]: "" }}
                aria-label={`Open cart, ${cartCount} ${cartCount === 1 ? "item" : "items"}`}
                className={iconButton}
              >
                <ShoppingBag aria-hidden="true" className="h-5 w-5" />
                {cartCount > 0 && (
                  <span
                    aria-hidden="true"
                    className="absolute right-0.5 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#a85414] px-1 text-[10px] font-bold tabular-nums leading-none text-white ring-2 ring-white"
                  >
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </button>

              <MobileNav />
            </div>
          </div>

          {mobileSearchOpen && (
            <div className="pb-3 sm:hidden">
              <SearchPopover autoFocus onNavigate={() => setMobileSearchOpen(false)} />
            </div>
          )}

          <div className="hidden lg:block">
            <NavMenu />
          </div>
        </div>
      </header>
    </>
  );
}
