"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, Phone, X } from "lucide-react";
import {
  categoryHref,
  subcategoryHref,
  visibleSubcategories,
} from "../data/categories";
import { brandHref } from "../data/brands";
import { useNavBrands } from "../context/BrandsContext";
import { useNavCategories } from "../context/CategoriesContext";
import { useSiteSettings } from "../context/StorefrontContext";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a85414]";

/** A drawer row, in bold; the current section gets a black marker on its left edge. */
function rowClass(active: boolean): string {
  return [
    "relative flex min-h-12 w-full items-center justify-between rounded-lg px-4 text-left text-[15px] font-bold text-neutral-950 transition-colors",
    "before:absolute before:inset-y-3 before:left-0 before:w-0.5 before:rounded-full",
    active ? "bg-neutral-50 before:bg-neutral-950" : "hover:bg-neutral-50 before:bg-transparent",
    focusRing,
  ].join(" ");
}

const subLinkClass = `block rounded-lg px-4 py-3 text-sm text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-950 aria-[current=page]:font-semibold aria-[current=page]:text-neutral-950 ${focusRing}`;

export default function MobileNav() {
  const pathname = usePathname();
  const navBrands = useNavBrands();
  const navCategories = useNavCategories();
  const site = useSiteSettings();
  // Both are kept with the page they were set on, so navigating closes the
  // drawer and folds its sections without an effect to reset them.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const setOpen = (next: boolean) => setOpenOn(next ? pathname : null);
  const [expandedOn, setExpandedOn] = useState<{ path: string; key: string } | null>(null);
  const expanded = expandedOn?.path === pathname ? expandedOn.key : null;
  const setExpanded = (key: string | null) => setExpandedOn(key ? { path: pathname, key } : null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Focus moves into the drawer when it opens and back to the menu button
  // when it closes; Escape closes it.
  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const trigger = triggerRef.current;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenOn(null);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      trigger?.focus();
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        className={`flex h-11 w-11 items-center justify-center rounded-full text-neutral-900 transition hover:bg-neutral-100 ${focusRing}`}
        aria-label="Open menu"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Menu aria-hidden="true" className="h-5 w-5" />
      </button>

      {/*
        Rendered into <body>, not where it sits in the tree. The header carries
        backdrop-blur, and a backdrop-filter makes an element the containing
        block for fixed-position descendants - so inset-y-0 resolved against the
        115px header instead of the viewport, leaving the drawer 114px tall with
        45px of a 713px menu visible.
      */}
      {open &&
        typeof document !== "undefined" &&
        createPortal(
        <>
          <div
            aria-hidden="true"
            className="fixed inset-0 z-[60] bg-neutral-950/30"
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="fixed inset-y-0 right-0 z-[70] flex w-full max-w-sm flex-col bg-white shadow-[-24px_0_48px_-24px_rgba(0,0,0,0.25)]"
          >
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-neutral-200 pl-5 pr-3">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
                Menu
              </span>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setOpen(false)}
                className={`flex h-11 w-11 items-center justify-center rounded-full text-neutral-700 transition hover:bg-neutral-100 hover:text-neutral-950 ${focusRing}`}
                aria-label="Close menu"
              >
                <X aria-hidden="true" className="h-5 w-5" />
              </button>
            </div>

            <nav aria-label="Main" className="flex-1 overflow-y-auto px-3 py-3">
              <Link href="/" className={rowClass(pathname === "/")}>
                Home
              </Link>

              <div className="mt-1">
                <button
                  type="button"
                  onClick={() =>
                    setExpanded(expanded === "brands" ? null : "brands")
                  }
                  aria-expanded={expanded === "brands"}
                  className={rowClass(pathname.startsWith("/brand/"))}
                >
                  Brands
                  <ChevronDown
                    aria-hidden="true"
                    className={`h-4 w-4 text-neutral-500 transition-transform ${
                      expanded === "brands" ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {expanded === "brands" && (
                  <div className="mb-2 ml-4 border-l border-neutral-200 pl-2">
                    {navBrands.map((brand) => (
                      <Link
                        key={brand.slug}
                        href={brandHref(brand.slug)}
                        aria-current={pathname === brandHref(brand.slug) ? "page" : undefined}
                        className={subLinkClass}
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
                const subs = visibleSubcategories(cat);

                // The desktop nav's rules, which mobile never got: a lone
                // subcategory echoing its parent (TVs > TVs) makes the whole
                // expander pointless, so the category is a plain link instead.
                const onlySubEchoesCategory =
                  subs.length === 1 &&
                  subs[0].label.trim().toLowerCase() === cat.label.trim().toLowerCase();

                if (subs.length === 0 || onlySubEchoesCategory) {
                  return (
                    <Link
                      key={cat.slug}
                      href={categoryHref(cat.slug)}
                      className={`mt-1 ${rowClass(catActive)}`}
                    >
                      {cat.navLabel}
                    </Link>
                  );
                }

                return (
                  <div key={cat.slug} className="mt-1">
                    <button
                      type="button"
                      onClick={() =>
                        setExpanded(isExpanded ? null : cat.slug)
                      }
                      aria-expanded={isExpanded}
                      className={rowClass(catActive)}
                    >
                      {cat.navLabel}
                      <ChevronDown
                        aria-hidden="true"
                        className={`h-4 w-4 text-neutral-500 transition-transform ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {isExpanded && (
                      <div className="mb-2 ml-4 border-l border-neutral-200 pl-2">
                        {/* "All X" only earns its place when there is more than
                            one child to be "all" of. */}
                        {subs.length > 1 && (
                          <Link
                            href={categoryHref(cat.slug)}
                            className={`${subLinkClass} font-semibold text-neutral-950`}
                          >
                            All {cat.label}
                          </Link>
                        )}
                        {subs.map((sub) => {
                          const href = subcategoryHref(cat, sub);
                          return (
                            <Link
                              key={sub.slug}
                              href={href}
                              aria-current={pathname === href ? "page" : undefined}
                              className={subLinkClass}
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

              <div className="mt-3 border-t border-neutral-200 pt-3">
                <Link href="/search" className={rowClass(pathname === "/search")}>
                  Search Products
                </Link>
                <Link href="/cart" className={rowClass(pathname === "/cart")}>
                  Your Cart
                </Link>
                <Link href="/track-order" className={rowClass(pathname === "/track-order")}>
                  Track Order
                </Link>
              </div>
            </nav>

            <div className="shrink-0 border-t border-neutral-200 p-3">
              <a
                href={`tel:${site.phone.replace(/\s/g, "")}`}
                className={`flex min-h-12 items-center gap-3 rounded-lg px-4 text-[15px] font-semibold text-neutral-950 transition-colors hover:bg-neutral-50 ${focusRing}`}
              >
                <Phone aria-hidden="true" className="h-4 w-4 text-[#a85414]" />
                <span className="tabular-nums">{site.phone}</span>
              </a>
            </div>
          </div>
        </>,
          document.body
        )}
    </div>
  );
}
