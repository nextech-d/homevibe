import { Check } from "lucide-react";
import { raisedSurface } from "./homeSurfaces";

/**
 * The same promise on all 117 product pages, so it lives in the template
 * rather than in a field or in 117 markdown bodies: warranty terms and service
 * details change in one place, with the change reviewable in git.
 */
const POINTS = [
  {
    lead: "We install it properly.",
    body: "Delivered, unboxed, positioned, connected and tested with you before we leave. Not a box dropped at your door.",
  },
  {
    lead: "We service what we sell.",
    body: "Twelve months from us, with our own technicians. Where a brand adds a longer manufacturer warranty, the product page says so. No third-party service centre to chase.",
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

export default function WhyBuyFromUs() {
  return (
    // Its own panel, apart from the description, so it reads as the shop
    // talking rather than as another section of the product's own copy.
    <section
      aria-labelledby="why-buy-from-us"
      className={`${raisedSurface} mt-8 p-6 sm:p-10`}
    >
      <h2
        id="why-buy-from-us"
        className="text-xl font-medium tracking-tight text-neutral-950 sm:text-2xl"
      >
        Why buy from us
      </h2>

      <ul className="mt-5 space-y-4">
        {POINTS.map((point) => (
          <li key={point.lead} className="flex gap-3">
            <Check className="mt-1 h-4 w-4 shrink-0 text-[#a85414]" aria-hidden="true" />
            <p className="text-base leading-relaxed text-neutral-700">
              <strong className="font-semibold text-neutral-950">{point.lead}</strong>{" "}
              {point.body}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
