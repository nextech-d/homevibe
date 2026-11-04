"use client";

import type { ProductOptionGroup } from "../../data/products";

/**
 * The product's options, one row per type: the type's name, then its values
 * as chips, one choice per type. Each row is a native radio group in a
 * fieldset, so arrow keys move between values and screen readers announce
 * "Length, 30M, radio button, 1 of 2"; the chips are the radios' labels.
 *
 * `missing` lists the types the customer tried to order without choosing:
 * each shows "Choose a length" beside its name until a value is picked.
 */
export default function ProductOptionPicker({
  productId,
  groups,
  selected,
  missing,
  onSelect,
}: {
  productId: number;
  groups: ProductOptionGroup[];
  selected: Record<number, number>;
  missing: number[];
  onSelect: (typeId: number, valueId: number) => void;
}) {
  if (groups.length === 0) return null;

  return (
    <div id="product-options" className="mb-5 flex flex-col gap-4">
      {groups.map((group) => {
        const isMissing = missing.includes(group.typeId);
        return (
          <fieldset key={group.typeId} className="min-w-0">
            {/* The message sits in the legend, so the group's name becomes
                "Length Choose a length" while it's missing, and is announced
                as it appears. */}
            <legend className="mb-2 flex flex-wrap items-baseline gap-x-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-neutral-600">
                {group.name}
              </span>
              <span role="status" className="text-xs font-semibold text-[#B42318]">
                {isMissing ? `Choose a ${group.name.toLowerCase()}` : ""}
              </span>
            </legend>
            <div className="flex flex-wrap gap-2">
              {group.values.map((value) => {
                const inputId = `option-${productId}-${group.typeId}-${value.id}`;
                const checked = selected[group.typeId] === value.id;
                return (
                  <div key={value.id}>
                    <input
                      type="radio"
                      id={inputId}
                      name={`option-${productId}-${group.typeId}`}
                      value={value.id}
                      checked={checked}
                      onChange={() => onSelect(group.typeId, value.id)}
                      className="peer sr-only"
                    />
                    <label
                      htmlFor={inputId}
                      className={`inline-flex min-h-11 cursor-pointer items-center rounded-full border px-4 text-[13px] font-medium transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#a85414] ${
                        checked
                          ? "border-[#a85414] bg-[#a85414] text-white"
                          : isMissing
                            ? "border-[#B42318] bg-white text-neutral-900 hover:border-[#a85414]"
                            : "border-[#DCE0E7] bg-white text-neutral-900 hover:border-[#a85414]"
                      }`}
                    >
                      {value.value}
                    </label>
                  </div>
                );
              })}
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}
