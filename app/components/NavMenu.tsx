"use client";

import { Fragment, useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { categoryHref, subcategoryHref } from "../data/categories";
import { brandHref } from "../data/brands";
import { useNavBrands } from "../context/BrandsContext";
import { useNavCategories } from "../context/CategoriesContext";

const linkClass =
  "block px-4 py-2 text-xs font-semibold text-black transition hover:bg-neutral-100 hover:text-black";

/**
 * Top-level nav item. The active one keeps the row's ink and takes a rounded
 * rule beneath it; the rule is a pseudo-element inheriting the text colour, so
 * the two can never disagree.
 */
function itemClass(active: boolean): string {
  return [
    "relative flex items-center gap-1 whitespace-nowrap rounded-full px-4 py-2 font-bold transition",
    "after:absolute after:inset-x-3 after:bottom-0.5 after:h-[3px] after:rounded-full",
    "text-black",
    active ? "after:bg-current" : "hover:bg-neutral-100 after:bg-transparent",
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
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={itemClass(Boolean(active))}
      >
        {label}
        <ChevronDown
          className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 max-h-80 min-w-[200px] overflow-y-auto overflow-hidden rounded-xl border border-neutral-200 bg-white py-2 shadow-lg">
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * Hairline between top-level items. Decorative only, so it is hidden from
 * assistive tech - the nav landmark already conveys the grouping.
 */
function NavDivider() {
  return <span aria-hidden="true" className="mx-1.5 h-3.5 w-px shrink-0 bg-neutral-300/70" />;
}

export default function NavMenu() {
  const pathname = usePathname();
  const navBrands = useNavBrands();
  const navCategories = useNavCategories();

  const navItems: React.ReactNode[] = [
    <Link key="home" href="/" className={itemClass(pathname === "/")}>
      Home
    </Link>,
    <NavDropdown key="brands" label="Brands" active={pathname.startsWith("/brand/")}>
      {navBrands.map((brand) => (
        <Link
          key={brand.slug}
          href={brandHref(brand.slug)}
          className={`${linkClass} ${pathname === brandHref(brand.slug) ? "font-bold" : ""}`}
        >
          {brand.name}
        </Link>
      ))}
    </NavDropdown>,
    ...navCategories.map((cat) => {
      const catActive = pathname.startsWith(`/category/${cat.slug}`);
      const subs = cat.subcategories;

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
            <Link
              href={categoryHref(cat.slug)}
              className={`${linkClass} border-b border-neutral-100 font-bold uppercase tracking-wider`}
            >
              All {cat.label}
            </Link>
          )}
          {subs.map((sub) => {
            const href = subcategoryHref(cat, sub);
            const isActive = pathname === href;
            return (
              <Link
                key={sub.slug}
                href={href}
                className={`${linkClass} ${isActive ? "font-bold" : ""}`}
              >
                {sub.label}
              </Link>
            );
          })}
        </NavDropdown>
      );
    }),
  ];

  return (
    <nav className="flex flex-wrap items-center justify-center gap-y-1 text-xs font-bold tracking-wider">
      {navItems.map((item, index) => (
        <Fragment key={index}>
          {index > 0 && <NavDivider />}
          {item}
        </Fragment>
      ))}
    </nav>
  );
}
