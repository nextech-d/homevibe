"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, X } from "lucide-react";
import {
  categoryHref,
  subcategoryHref,
} from "../data/categories";
import { brandHref } from "../data/brands";
import { useNavBrands } from "../context/BrandsContext";
import { useNavCategories } from "../context/CategoriesContext";

export default function MobileNav() {
  const pathname = usePathname();
  const navBrands = useNavBrands();
  const navCategories = useNavCategories();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    setOpen(false);
    setExpanded(null);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white text-black transition hover:bg-neutral-50"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close menu overlay"
            className="fixed inset-0 z-[60] bg-black/40"
            onClick={() => setOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 z-[70] flex w-full max-w-sm flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
              <span className="text-sm font-black uppercase tracking-tight text-black">
                Menu
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-600 hover:bg-neutral-100"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-4">
              <Link
                href="/"
                className={`block rounded-lg px-3 py-3 text-sm font-bold text-black ${
                  pathname === "/" ? "bg-neutral-100" : "hover:bg-neutral-50"
                }`}
              >
                Home
              </Link>

              <div className="mt-1">
                <button
                  type="button"
                  onClick={() =>
                    setExpanded(expanded === "brands" ? null : "brands")
                  }
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-3 text-left text-sm font-bold text-black ${
                    pathname.startsWith("/brand/") ? "bg-neutral-100" : "hover:bg-neutral-50"
                  }`}
                >
                  Brands
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${
                      expanded === "brands" ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {expanded === "brands" && (
                  <div className="mb-2 ml-2 border-l border-neutral-200 pl-2">
                    {navBrands.map((brand) => (
                      <Link
                        key={brand.slug}
                        href={brandHref(brand.slug)}
                        className={`block rounded-lg px-3 py-2.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 ${
                          pathname === brandHref(brand.slug) ? "font-bold text-black" : ""
                        }`}
                      >
                        {brand.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {navCategories.map((cat) => {
                const isExpanded = expanded === cat.slug;
                const catActive = pathname.startsWith(`/category/${cat.slug}`);

                return (
                  <div key={cat.slug} className="mt-1">
                    <button
                      type="button"
                      onClick={() =>
                        setExpanded(isExpanded ? null : cat.slug)
                      }
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-3 text-left text-sm font-bold text-black ${
                        catActive ? "bg-neutral-100" : "hover:bg-neutral-50"
                      }`}
                    >
                      {cat.navLabel}
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {isExpanded && (
                      <div className="mb-2 ml-2 border-l border-neutral-200 pl-2">
                        <Link
                          href={categoryHref(cat.slug)}
                          className="block rounded-lg px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-neutral-800 hover:bg-neutral-50"
                        >
                          All {cat.label}
                        </Link>
                        {cat.subcategories.map((sub) => {
                          const href = subcategoryHref(cat, sub);
                          return (
                            <Link
                              key={sub.slug}
                              href={href}
                              className={`block rounded-lg px-3 py-2.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 ${
                                pathname === href ? "font-bold text-black" : ""
                              }`}
                            >
                              {sub.label}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              <div className="mt-4 border-t border-neutral-200 pt-4">
                <Link
                  href="/search"
                  className="block rounded-lg px-3 py-3 text-sm font-semibold text-black hover:bg-neutral-50"
                >
                  Search Products
                </Link>
                <Link
                  href="/cart"
                  className="block rounded-lg px-3 py-3 text-sm font-semibold text-black hover:bg-neutral-50"
                >
                  Your Cart
                </Link>
                <Link
                  href="/track-order"
                  className="block rounded-lg px-3 py-3 text-sm font-semibold text-black hover:bg-neutral-50"
                >
                  Track Order
                </Link>
              </div>
            </nav>
          </div>
        </>
      )}
    </div>
  );
}
