import FeaturedBrands from "./components/FeaturedBrands";
import GoogleReviews from "./components/GoogleReviews";
import HomeHero from "./components/HomeHero";
import HomeFeatured from "./components/HomeFeatured";
import HomeFaq from "./components/HomeFaq";
import FaqJsonLd from "./components/FaqJsonLd";
import { getInventory } from "./lib/inventory.server";
import { getFaqItemsData, getFeaturedColumnIds } from "./lib/storefront.server";
import { featuredSelection, toCatalogProduct } from "./lib/inventory";

export default async function Home() {
  const [inventory, featuredColumns, faqItems] = await Promise.all([
    getInventory(),
    getFeaturedColumnIds(),
    getFaqItemsData(),
  ]);

  // Chosen here rather than in the grid, so the cards are in the initial HTML
  // and only the handful that render travel with it.
  const featured = featuredSelection(inventory, featuredColumns).map(toCatalogProduct);

  return (
    <div className="min-h-screen bg-[var(--bg)] font-sans relative">
      <FaqJsonLd items={faqItems} />
      <main className="mx-auto max-w-7xl px-6 py-12">
        <HomeHero />

        <section id="featured-products">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-black">
                Featured Products
              </h2>
              <p className="mt-1 text-sm text-black/60">Our top performing items.</p>
            </div>
          </div>

          <HomeFeatured products={featured} featuredColumns={featuredColumns} />
        </section>

        <FeaturedBrands />

        <GoogleReviews />

        <HomeFaq items={faqItems} />
      </main>
    </div>
  );
}
