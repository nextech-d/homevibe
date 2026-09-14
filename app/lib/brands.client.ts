import { FEATURED_BRANDS, type Brand } from "../data/brands";
import { apiUrl } from "./api-client";

/** Client-side fetch of brands via the catalog API. */
export async function fetchBrandsClient(): Promise<Brand[]> {
  const endpoint = apiUrl("/catalog/brands") || "/api/catalog/brands";
  try {
    const res = await fetch(endpoint, { cache: "no-store" });
    if (!res.ok) return FEATURED_BRANDS;
    const data = (await res.json()) as {
      success?: boolean;
      brands?: Array<{ name: string; slug: string; tier: Brand["tier"]; origin: string }>;
    };
    if (data.success && Array.isArray(data.brands) && data.brands.length > 0) {
      return data.brands.map(({ name, slug, tier, origin }) => ({ name, slug, tier, origin }));
    }
  } catch {
    /* fall through */
  }
  return FEATURED_BRANDS;
}
