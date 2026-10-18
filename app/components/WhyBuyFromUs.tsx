import { Check } from "lucide-react";
import {
  WHY_BUY_GROUP,
  WHY_BUY_GROUP_POINTS,
  WHY_BUY_SHARED_POINTS,
} from "../config/site";
import { raisedSurface } from "./homeSurfaces";

/**
 * The shop's promise, in the template rather than in 117 markdown bodies, so
 * it changes in one place, reviewably in git. Shared points first, then the
 * product's group's (app/config/site.ts).
 */

export default function WhyBuyFromUs({ subcategory }: { subcategory: string }) {
  const points = [
    ...WHY_BUY_SHARED_POINTS,
    ...WHY_BUY_GROUP_POINTS[WHY_BUY_GROUP[subcategory] ?? "generic"],
  ];

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
        {points.map((point, index) => (
          <li key={index} className="flex gap-3">
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
