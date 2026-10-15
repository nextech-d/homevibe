"use client";

import { useState, useRef, useEffect, useId } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { categoryHref, subcategoryHref, visibleSubcategories } from "../data/categories";
import { brandHref } from "../data/brands";
import { useNavBrands } from "../context/BrandsContext";
import { useNavCategories } from "../context/CategoriesContext";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a85414]";

const linkClass = `block rounded-lg px-3 py-2 text-sm text-neutral-700 transition-colors hover:bg-neutral-50 hover:text-neutral-950 ${focusRing}`;

/**
 * Top-level item, in bold ink. A black rule grows under it on hover and stays
 * under the current section; it is a pseudo-element, so it never moves the
 * text.
 */
function itemClass(active: boolean): string {
  return [
    "relative flex h-12 items-center gap-1 whitespace-nowrap px-3 text-[13px] font-bold tracking-wide text-neutral-950 transition-colors",
    "after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:origin-center after:rounded-full after:bg-neutral-950 after:transition-transform after:duration-200",
    active ? "after:scale-x-100" : "after:scale-x-0 hover:after:scale-x-100",
    focusRing,
  ].join(" ");
}

function NavDropdown({
  label,
  children,
  active,
}: {
  label: string;
  children: React.ReactNode;
  active?: boolean;
}) {
  const pathname = usePathname();
  // Open on the page it was opened on: following a link inside closes it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const setOpen = (next: boolean) => setOpenOn(next ? pathname : null);
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpenOn(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const focusFirstLink = () =>
    requestAnimationFrame(() => ref.current?.querySelector<HTMLAnchorElement>("[data-menu] a")?.focus());

  return (
    <div
      ref={ref}
      className="relative"
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) {
          setOpen(false);
          buttonRef.current?.focus();
        }
      }}
      // Tabbing past the last link closes the menu instead of leaving it open
      // over the page.
      onBlur={(e) => {
        if (!ref.current?.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(!open)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            focusFirstLink();
          }
        }}
        aria-expanded={open}
        aria-controls={menuId}
        className={itemClass(Boolean(active))}
      >
        {label}
        <ChevronDown
          aria-hidden="true"
          className={`h-3.5 w-3.5 text-neutral-500 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div
          id={menuId}
          data-menu
          className="absolute left-1/2 top-full z-40 mt-2 max-h-[min(24rem,70vh)] min-w-[220px] -translate-x-1/2 overflow-y-auto rounded-xl border border-neutral-200 bg-white p-1.5 shadow-[0_12px_32px_-12px_rgba(0,0,0,0.18)]"
        >
          {children}
        </div>
      )}
    </div>
  );
}

export default function NavMenu() {
  const pathname = usePathname();
  const navBrands = useNavBrands();
  const navCategories = useNavCategories();

  return (
    <nav aria-label="Main" className="flex items-center justify-center">
      <Link href="/" className={itemClass(pathname === "/")}>
        Home
      </Link>
      <NavDropdown label="Brands" active={pathname.startsWith("/brand/")}>
        {navBrands.map((brand) => (
          <Link
            key={brand.slug}
            href={brandHref(brand.slug)}
            aria-current={pathname === brandHref(brand.slug) ? "page" : undefined}
            className={`${linkClass} aria-[current=page]:font-semibold aria-[current=page]:text-neutral-950`}
          >
            {brand.name}
          </Link>
        ))}
      </NavDropdown>
      {navCategories.map((cat) => {
        const catActive = pathname.startsWith(`/category/${cat.slug}`);
        const subs = visibleSubcategories(cat);

        // A lone subcategory echoing its parent (TVs > TVs) makes a dropdown
        // pointless - link straight to the category instead.
        const onlySubEchoesCategory =
          subs.length === 1 &&
          subs[0].label.trim().toLowerCase() === cat.label.trim().toLowerCase();

        if (subs.length === 0 || onlySubEchoesCategory) {
          return (
            <Link key={cat.slug} href={categoryHref(cat.slug)} className={itemClass(catActive)}>
              {cat.navLabel}
            </Link>
          );
        }

        return (
          <NavDropdown key={cat.slug} label={cat.navLabel} active={catActive}>
            {/* "All X" only earns its place when there is more than one child. */}
            {subs.length > 1 && (
              <>
                <Link
                  href={categoryHref(cat.slug)}
                  className={`${linkClass} font-semibold text-neutral-950`}
                >
                  All {cat.label}
                </Link>
                <div aria-hidden="true" className="mx-3 my-1 h-px bg-neutral-100" />
              </>
            )}
            {subs.map((sub) => {
              const href = subcategoryHref(cat, sub);
              return (
                <Link
                  key={sub.slug}
                  href={href}
                  aria-current={pathname === href ? "page" : undefined}
                  className={`${linkClass} aria-[current=page]:font-semibold aria-[current=page]:text-neutral-950`}
                >
                  {sub.label}
                </Link>
              );
            })}
          </NavDropdown>
        );
      })}
    </nav>
  );
}
