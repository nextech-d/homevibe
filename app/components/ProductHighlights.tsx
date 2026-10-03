import { Check } from "lucide-react";

/**
 * The handful of things worth knowing about a product before reading its
 * description - the ones that decide a sale rather than describe a feature.
 *
 * Edited one per line in the admin and stored as an array. Plain text, not
 * markdown: a highlight that needs formatting is a paragraph, and belongs in
 * the long-form section instead.
 *
 * Renders nothing when a product has none, which is most of them until they
 * are written.
 */
export default function ProductHighlights({ items }: { items: string[] }) {
  const highlights = items.map((item) => item.trim()).filter(Boolean);
  if (highlights.length === 0) return null;

  return (
    <section className="mt-24 w-full border-t border-neutral-300/70 pt-12">
      <h2 className="mb-8 text-2xl font-bold tracking-tight text-neutral-950">
        Worth knowing
      </h2>
      {/* Two columns from md up, matching the questions below: a stack of
          short lines wastes the width the rest of the page uses. */}
      <ul className="grid list-none grid-cols-1 gap-3 pl-0 md:grid-cols-2">
        {highlights.map((highlight) => (
          <li
            key={highlight}
            className="flex items-start gap-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm"
          >
            <Check size={16} className="mt-0.5 shrink-0 text-emerald-600" aria-hidden />
            <span className="text-sm leading-relaxed text-neutral-800">{highlight}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
