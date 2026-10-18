import FeaturedBrands from "./components/FeaturedBrands";
import GoogleReviews from "./components/GoogleReviews";
import HomeHero from "./components/HomeHero";
import HomeFeatured from "./components/HomeFeatured";
import HomeFaq from "./components/HomeFaq";
import FaqJsonLd from "./components/FaqJsonLd";
import { sectionHeading } from "./components/homeSurfaces";
import { getBrandProductCounts, getFeaturedCandidates } from "./lib/inventory.server";
import { getFaqItemsData, getFeaturedColumnIds } from "./lib/storefront.server";
import { featuredSelection, toCatalogProduct } from "./lib/inventory";

/**
 * Cached, and refreshed on demand: every admin save calls /api/revalidate,
 * which clears the whole layout. The 60 seconds is only the backstop - the
 * longest anything a refresh missed can stay stale.
 */
export const revalidate = 60;

export default async function Home() {
  const [featuredColumns, faqItems, brandProductCounts] = await Promise.all([
    getFeaturedColumnIds(),
    getFaqItemsData(),
    getBrandProductCounts(),
  ]);

  // Chosen here rather than in the grid, so the cards are in the initial HTML
  // and only the handful that render travel with it. Only the candidates are
  // loaded, not the whole catalogue: the slots say which ones those are.
  const candidates = await getFeaturedCandidates(featuredColumns);
  const featured = featuredSelection(candidates, featuredColumns).map(toCatalogProduct);

  return (
    <div className="relative min-h-screen font-sans">
      <FaqJsonLd items={faqItems} />
      <main className="mx-auto max-w-7xl px-6 py-12">
        <HomeHero />

        <section id="featured-products">
          <h2 className={`mb-6 ${sectionHeading}`}>Featured products</h2>

          <HomeFeatured products={featured} featuredColumns={featuredColumns} />
        </section>

        <FeaturedBrands productCounts={brandProductCounts} />

        <GoogleReviews />

        <HomeFaq items={faqItems} />
      </main>
    </div>
  );
}
