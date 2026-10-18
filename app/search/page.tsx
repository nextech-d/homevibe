import Link from "next/link";
import SearchResultsGrid from "./SearchResultsGrid";
import { pageHeading, primaryButton, raisedSurface } from "../components/homeSurfaces";
import { getSearchIndex } from "../lib/search.server";
import { getAllSearchResults, SEARCH_QUERY_MAX_LENGTH } from "../lib/searchProducts";

type Props = {
  searchParams: Promise<{ q?: string | string[] }>;
};

/**
 * Matched on the server from ?q=, from the same cached index and with the same
 * matching as the header's suggestions, so the results are in the HTML and the
 * browser downloads no catalogue. If the index can't be loaded the page throws
 * to the error page rather than reporting "No products found" for a search
 * that never ran.
 */
export default async function SearchPage({ searchParams }: Props) {
  const raw = (await searchParams).q;
  const q = (Array.isArray(raw) ? raw[0] : raw ?? "").trim().slice(0, SEARCH_QUERY_MAX_LENGTH);
  const results = q
    ? getAllSearchResults(q, await getSearchIndex()).map(({ id, slug, name, price, status, image, imageSet }) => ({
        id,
        slug,
        name,
        price,
        status,
        image,
        imageSet,
      }))
    : [];

  return (
    <div className="min-h-screen pb-24">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <h1 className={pageHeading}>Search results</h1>
        {q ? (
          <p className="mt-3 text-base text-neutral-600">
            {`${results.length} result${results.length !== 1 ? "s" : ""} for "${q}"`}
          </p>
        ) : (
          <p className="mt-3 text-base text-neutral-600">Enter a search term to find products.</p>
        )}

        {results.length === 0 && q ? (
          <div className={`${raisedSurface} mt-10 px-6 py-16 text-center`}>
            <p className="text-lg font-semibold text-neutral-950">No products found.</p>
            <Link href="/" className={`mt-6 ${primaryButton}`}>
              Browse all products
            </Link>
          </div>
        ) : (
          <SearchResultsGrid products={results} />
        )}
      </div>
    </div>
  );
}
