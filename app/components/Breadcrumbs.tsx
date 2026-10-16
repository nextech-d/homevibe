import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { focusRing } from "./homeSurfaces";

export type Crumb = { label: string; href?: string };

/**
 * The visible trail at the top of a catalogue, product or article page. It
 * replaces four hand-rolled copies that had drifted into four looks. Visual
 * only: the search engines' copy is BreadcrumbJsonLd, unchanged.
 *
 * Each link is 44px tall for the thumb. The last crumb is the page itself, so
 * it is text with aria-current rather than a link. It wraps instead of
 * overflowing, so a long product name can't push a phone sideways.
 */
export default function Breadcrumbs({
  items,
  className = "",
}: {
  items: Crumb[];
  className?: string;
}) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-x-1 text-sm text-neutral-600">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${i}-${item.label}`} className="flex min-w-0 items-center gap-x-1">
              {item.href && !last ? (
                <Link
                  href={item.href}
                  className={`inline-flex min-h-11 items-center rounded-sm transition-colors hover:text-neutral-950 hover:underline ${focusRing}`}
                >
                  {item.label}
                </Link>
              ) : (
                <span aria-current={last ? "page" : undefined} className="py-3 font-medium text-neutral-950">
                  {item.label}
                </span>
              )}
              {!last && <ChevronRight aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-neutral-500" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
