import { Check } from "lucide-react";

/**
 * The same promise on all 117 product pages, so it lives in the template
 * rather than in a field or in 117 markdown bodies: warranty terms and service
 * details change in one place, with the change reviewable in git.
 */
const POINTS = [
  {
    lead: "We install it properly.",
    body: "Plumbed in, levelled, transit bolts removed, one cycle run with you. Not a box left at your door.",
  },
  {
    lead: "We service what we sell.",
    body: "Twelve months, our own technicians, at your home or our workshop. No third-party service centre, no waiting on an imported part.",
  },
  {
    lead: "We stock the parts.",
    body: "Drain pumps, door seals, heating elements — we keep them and we'll tell you what a repair costs before you commit to it.",
  },
  {
    lead: "We'll tell you when not to buy.",
    body: "If your water pressure won't run a front loader, or the machine is too big for your kitchen, we'd rather say so now than deal with it after delivery.",
  },
] as const;

const CLOSER = "Genuine units, sourced directly from the manufacturer.";

export default function WhyBuyFromUs() {
  return (
    // Bordered and on the surface colour so it reads as the shop talking, not
    // as another section of the product's own copy.
    <section
      aria-labelledby="why-buy-from-us"
      className="mt-10 rounded-2xl border border-neutral-200/80 bg-[color:var(--surface)] p-6 sm:p-8"
    >
      <h2
        id="why-buy-from-us"
        className="text-lg font-bold tracking-tight text-neutral-950 sm:text-xl"
      >
        Why buy from us
      </h2>

      <ul className="mt-5 space-y-4">
        {POINTS.map((point) => (
          <li key={point.lead} className="flex gap-3">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-neutral-900" aria-hidden="true" />
            <p className="text-sm leading-relaxed text-neutral-700">
              <strong className="font-semibold text-neutral-950">{point.lead}</strong>{" "}
              {point.body}
            </p>
          </li>
        ))}
      </ul>

      <p className="mt-6 border-t border-neutral-200/80 pt-4 text-sm font-semibold text-neutral-950">
        {CLOSER}
      </p>
    </section>
  );
}
