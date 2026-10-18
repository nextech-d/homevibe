/** What the matching reads. A full product or a search index entry both have it. */
export type Searchable = { name: string; category: string; subcategory: string; brand: string };

/** The longest query worth matching; anything after it is ignored. */
export const SEARCH_QUERY_MAX_LENGTH = 80;

/**
 * A case-insensitive substring match on name, category, subcategory and brand,
 * in catalogue order. Shared by the search endpoint and the search page, so the
 * header's suggestions and the full results always agree.
 */
function filterByQuery<T extends Searchable>(inventory: T[], query: string): T[] {
  const q = query.trim().slice(0, SEARCH_QUERY_MAX_LENGTH).toLowerCase();
  if (!q) return [];

  return inventory.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.subcategory.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q)
  );
}

export function searchProducts<T extends Searchable>(query: string, limit = 5, inventory: T[]): T[] {
  return filterByQuery(inventory, query).slice(0, limit);
}

export function getAllSearchResults<T extends Searchable>(query: string, inventory: T[]): T[] {
  return filterByQuery(inventory, query);
}
