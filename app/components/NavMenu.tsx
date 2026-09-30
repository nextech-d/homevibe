"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { categoryHref, subcategoryHref } from "../data/categories";
import { brandHref } from "../data/brands";
import { useNavBrands } from "../context/BrandsContext";
import { useNavCategories } from "../context/CategoriesContext";

const linkClass =
  "block px-4 py-2 text-xs font-semibold text-black transition hover:bg-neutral-100 hover:text-black";

/** Top-level nav item. The active one is a filled pill, as in the design. */
function itemClass(active: boolean): string {
  return [
    "flex items-center gap-1 whitespace-nowrap rounded-full px-4 py-2 font-bold transition",
    active ? "bg-black text-white" : "text-black hover:bg-neutral-100",
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
          className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""} ${
            active ? "text-white" : "text-black"
          }`}
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

export default function NavMenu() {
  const pathname = usePathname();
  const navBrands = useNavBrands();
  const navCategories = useNavCategories();

  return (
    <nav className="flex flex-wrap items-center justify-center gap-x-1 gap-y-1 text-xs font-bold tracking-wider">
      <Link href="/" className={itemClass(pathname === "/")}>
        Home
      </Link>

      <NavDropdown label="Brands" active={pathname.startsWith("/brand/")}>
        {navBrands.map((brand) => (
          <Link
            key={brand.slug}
            href={brandHref(brand.slug)}
            className={`${linkClass} ${pathname === brandHref(brand.slug) ? "font-bold" : ""}`}
          >
            {brand.name}
          </Link>
        ))}
      </NavDropdown>

      {navCategories.map((cat) => {
        const catActive = pathname.startsWith(`/category/${cat.slug}`);

        return (
          <NavDropdown key={cat.slug} label={cat.navLabel} active={catActive}>
            <Link
              href={categoryHref(cat.slug)}
              className={`${linkClass} border-b border-neutral-100 font-bold uppercase tracking-wider`}
            >
              All {cat.label}
            </Link>
            {cat.subcategories.map((sub) => {
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
      })}
    </nav>
  );
}
