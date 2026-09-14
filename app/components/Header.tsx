"use client";

import Image from "next/image";
import Link from "next/link";
import { SITE } from "../config/site";
import { useCart } from "../context/CartContext";
import SearchPopover from "./SearchPopover";
import NavMenu from "./NavMenu";
import MobileNav from "./MobileNav";

function BrandLink() {
  return (
    <Link
      href="/"
      aria-label={`${SITE.name} home`}
      className="flex min-w-0 items-center gap-2 sm:gap-2.5"
    >
      <Image
        src="/logo.png"
        alt=""
        width={250}
        height={250}
        className="h-9 w-auto shrink-0 sm:h-10 md:h-11"
        priority
      />
      <span className="truncate text-lg font-black tracking-tight text-black sm:text-xl md:text-2xl">
        Home<span className="font-black">Vibe</span>
      </span>
    </Link>
  );
}

export default function Header() {
  const { items, setCartOpen } = useCart();
  const cartCount = items.reduce((c, i) => c + i.qty, 0);

  const cartButton = (
    <button
      onClick={() => setCartOpen(true)}
      className="group relative flex shrink-0 items-center gap-2 rounded-full bg-neutral-900 px-3 py-2.5 text-xs font-bold uppercase tracking-widest text-white shadow-md transition hover:bg-black active:scale-95 sm:px-4"
      aria-label={`Open cart, ${cartCount} items`}
    >
      <span className="hidden sm:inline">Cart</span>
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 px-1 text-[9px] font-black text-white">
        {cartCount}
      </span>
    </button>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200/70 bg-[color:var(--surface)]/90 backdrop-blur supports-[backdrop-filter]:bg-[color:var(--surface)]/70">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Mobile: brand + actions, then full-width search */}
        <div className="flex flex-col gap-3 py-3 lg:hidden">
          <div className="flex min-w-0 items-center justify-between gap-2">
            <BrandLink />
            <div className="flex shrink-0 items-center gap-2">
              <MobileNav />
              {cartButton}
            </div>
          </div>
          <SearchPopover />
        </div>

        {/* Desktop: single row */}
        <div className="hidden h-20 items-center justify-between gap-4 lg:flex">
          <div className="flex shrink-0 items-center">
            <BrandLink />
          </div>
          <div className="mx-4 min-w-0 max-w-lg flex-1">
            <SearchPopover />
          </div>
          <div className="flex shrink-0 items-center space-x-3">
            <NavMenu />
            {cartButton}
          </div>
        </div>
      </div>
    </header>
  );
}
