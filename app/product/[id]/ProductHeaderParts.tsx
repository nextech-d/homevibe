"use client";

import { Fragment, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { ShieldCheck, ShoppingCart, Truck, Wallet, Wrench, type LucideIcon } from "lucide-react";
import { INSTALLATION_WORDING, PRODUCT_TRUST_POINTS } from "../../config/site";
import WhatsAppIcon from "../../components/WhatsAppIcon";
import { focusRing } from "../../components/homeSurfaces";
import { CART_INTENT_ATTRIBUTE } from "../../components/cartUiLoaders";

/**
 * Hyphenated words ("12-month", "M-Pesa", "55-Inch") kept whole, and with
 * `brackets`, bracketed asides too ("(bracket not included)"). A browser may
 * break a line after a hyphen - it split "in-house" across two lines in the old
 * cards, and "QD-" from "MiniLED" in a product name - and a wrapped aside left
 * "included)" alone on a line. The text itself is unchanged, so copied text
 * reads the same.
 */
export function keepWhole(text: string, { brackets = false }: { brackets?: boolean } = {}): ReactNode {
  const pattern = brackets ? /(\([^)]*\)|\S+-\S+)/ : /(\S+-\S+)/;
  return text.split(pattern).map((part, i) =>
    (brackets && /^\(.*\)$/.test(part)) || /\S-\S/.test(part) ? (
      <span key={i} className="whitespace-nowrap">
        {part}
      </span>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    )
  );
}

const factLink = `inline-flex min-h-9 items-center rounded-sm text-sm font-semibold text-neutral-950 underline-offset-4 hover:text-[#8f4710] hover:underline ${focusRing}`;

/**
 * The product's facts on one slim line: its brand and what it is, both links,
 * and its stock only when that says something - every product is "In Stock"
 * unless the admin marks it otherwise, so that state goes unsaid.
 */
export function ProductFacts({
  brand,
  brandHref,
  category,
  categoryHref,
  status,
}: {
  brand: string;
  brandHref?: string;
  category: string;
  categoryHref: string;
  status: string;
}) {
  const stock = status.toLowerCase();
  const stockNote = stock.includes("out") ? "Out of stock" : stock.includes("low") ? "Low stock" : null;

  return (
    <dl className="flex flex-col items-start">
      <div className="flex items-center gap-2">
        <dt className="text-sm text-neutral-600">Brand</dt>
        <dd>
          {brandHref ? (
            <Link href={brandHref} className={factLink}>
              {brand}
            </Link>
          ) : (
            <span className="text-sm font-semibold text-neutral-950">{brand}</span>
          )}
        </dd>
      </div>
      <div className="flex items-center gap-2">
        <dt className="text-sm text-neutral-600">Category</dt>
        <dd>
          <Link href={categoryHref} className={factLink}>
            {category}
          </Link>
        </dd>
      </div>
      {stockNote && (
        <div className="flex min-h-11 items-center gap-2">
          <dt className="sr-only">Availability</dt>
          <dd
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${
              stockNote === "Low stock"
                ? "border-[#a85414] text-[#8f4710]"
                : "border-neutral-400 text-neutral-800"
            }`}
          >
            {stockNote}
          </dd>
        </div>
      )}
    </dl>
  );
}

const TRUST_ICONS: Record<(typeof PRODUCT_TRUST_POINTS)[number]["id"] | "installation", LucideIcon> = {
  delivery: Truck,
  warranty: ShieldCheck,
  payment: Wallet,
  installation: Wrench,
};

/**
 * The trust points, quietly: an icon and one line each. Installation only
 * where we install, in that subcategory's wording (INSTALLATION_WORDING).
 */
export function ProductTrustPoints({ subcategory }: { subcategory: string }) {
  const installation = INSTALLATION_WORDING[subcategory];
  const points: { id: keyof typeof TRUST_ICONS; text: string }[] = [
    ...PRODUCT_TRUST_POINTS,
    ...(installation ? [{ id: "installation" as const, text: installation }] : []),
  ];

  return (
    <ul className="space-y-2.5">
      {points.map((point) => {
        const Icon = TRUST_ICONS[point.id];
        return (
          <li key={point.id} className="flex items-start gap-2.5 text-sm leading-snug text-neutral-700">
            <Icon aria-hidden="true" className="mt-px h-4 w-4 shrink-0 text-[#a85414]" strokeWidth={1.8} />
            <span>{keepWhole(point.text, { brackets: true })}</span>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Phones only: Add to cart and WhatsApp pinned to the bottom of the screen,
 * so both are in reach from the first screen, above the gallery's height.
 *
 * It steps aside while the page's own buttons (`watchId`) are on screen, so
 * the two sets never show at once; hidden, it's inert, so keyboard and screen
 * reader users never land on it. The page keeps its height clear at the
 * bottom (globals.css, `body:has([data-pinned-bar])`), so the footer's last
 * line is never under it. The bottom padding takes in the iPhone home-bar
 * inset where the browser reports one.
 */
export function PinnedProductBar({
  watchId,
  onAddToCart,
  added,
  whatsappUrl,
  outOfStock,
}: {
  watchId: string;
  onAddToCart: () => void;
  added: boolean;
  whatsappUrl: string;
  outOfStock: boolean;
}) {
  const [pageButtonsVisible, setPageButtonsVisible] = useState(false);

  useEffect(() => {
    const target = document.getElementById(watchId);
    if (!target) return;
    const observer = new IntersectionObserver(([entry]) => setPageButtonsVisible(entry.isIntersecting));
    observer.observe(target);
    return () => observer.disconnect();
  }, [watchId]);

  return (
    <div
      data-pinned-bar
      inert={pageButtonsVisible}
      aria-hidden={pageButtonsVisible || undefined}
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-[#DCE0E7] bg-white px-3 pt-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] shadow-[0_-6px_16px_-10px_rgba(112,122,142,0.45)] transition-transform duration-200 motion-reduce:transition-none lg:hidden ${
        pageButtonsVisible ? "translate-y-full" : "translate-y-0"
      }`}
    >
      <div className="mx-auto flex max-w-xl gap-2">
        <button
          type="button"
          onClick={onAddToCart}
          {...{ [CART_INTENT_ATTRIBUTE]: "" }}
          disabled={added}
          className={`inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-full px-4 text-[13px] font-semibold text-white transition-colors ${focusRing} ${
            added ? "bg-emerald-700" : "bg-[#a85414] hover:bg-[#8f4710]"
          }`}
        >
          <ShoppingCart size={16} aria-hidden="true" />
          {added ? "Added" : "Add to cart"}
        </button>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex h-11 min-w-0 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border-2 border-[#a85414] px-2 text-[13px] font-semibold text-[#8f4710] transition-colors hover:bg-[#a85414]/10 ${focusRing}`}
        >
          <WhatsAppIcon className="h-4 w-4 shrink-0" />
          {outOfStock ? "Ask about availability" : "Order on WhatsApp"}
        </a>
      </div>
    </div>
  );
}
