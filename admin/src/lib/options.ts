/** System data: option types (Size, Color...) and their values, as the API lists them. */
export type OptionValueItem = {
  id: number;
  value: string;
  sortOrder: number;
  /** Products with this value ticked. */
  productCount: number;
};

export type OptionTypeItem = {
  id: number;
  name: string;
  sortOrder: number;
  values: OptionValueItem[];
  /** Distinct products with any of this type's values ticked. */
  productCount: number;
};

export function productsLabel(count: number): string {
  return `${count} product${count === 1 ? "" : "s"}`;
}
