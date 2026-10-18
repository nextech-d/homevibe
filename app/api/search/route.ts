import { NextResponse, type NextRequest } from "next/server";
import { getSearchIndex } from "../../lib/search.server";
import { searchProducts, getAllSearchResults, SEARCH_QUERY_MAX_LENGTH } from "../../lib/searchProducts";
import { getProductThumbnail } from "../../lib/productImages";

/** The header shows 5; the cap only stops one request asking for everything. */
const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 12;

/** What a search suggestion shows, and nothing else. */
export type SearchSuggestion = {
  id: number;
  slug: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  thumbnail: string;
};

/**
 * The header's search-as-you-type: the top matches and how many there are in
 * all, matched exactly as the search page matches. Answers come from the
 * cached search index, and are cached at the edge for a minute per query, so a
 * keystroke rarely reaches the database.
 */
export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") ?? "").trim().slice(0, SEARCH_QUERY_MAX_LENGTH);
  const requested = Number(request.nextUrl.searchParams.get("limit") ?? DEFAULT_LIMIT);
  const limit = Number.isInteger(requested) ? Math.min(Math.max(requested, 1), MAX_LIMIT) : DEFAULT_LIMIT;

  if (!q) {
    return NextResponse.json({ success: true, total: 0, results: [] });
  }

  try {
    const index = await getSearchIndex();
    const results: SearchSuggestion[] = searchProducts(q, limit, index).map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      brand: p.brand,
      category: p.category,
      price: p.price,
      thumbnail: getProductThumbnail(p),
    }));
    return NextResponse.json(
      { success: true, total: getAllSearchResults(q, index).length, results },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
    );
  } catch (error) {
    console.error("Search failed:", error);
    return NextResponse.json({ success: false, message: "Search is unavailable right now." }, { status: 503 });
  }
}
