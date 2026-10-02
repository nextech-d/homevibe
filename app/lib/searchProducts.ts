import type { Appliance } from "../data/products";

function filterByQuery(inventory: Appliance[], query: string): Appliance[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  return inventory.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.subcategory.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q)
  );
}

export function searchProducts(
  query: string,
  limit = 5,
  inventory: Appliance[]
): Appliance[] {
  return filterByQuery(inventory, query).slice(0, limit);
}

export function getAllSearchResults(
  query: string,
  inventory: Appliance[]
): Appliance[] {
  return filterByQuery(inventory, query);
}
