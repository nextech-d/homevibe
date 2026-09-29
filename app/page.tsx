"use client";

import React from "react";
import ProductCard from "./components/ProductCard";
import FeaturedBrands from "./components/FeaturedBrands";
import GoogleReviews from "./components/GoogleReviews";
import FeaturedProductsGrid from "./components/FeaturedProductsGrid";
import HomeHero from "./components/HomeHero";
import { useAddToCart } from "./hooks/useAddToCart";
import { useInventory } from "./context/ProductsContext";
import { useStorefront } from "./context/StorefrontContext";

export default function Home() {
  const { handleAddToCart, addedIds } = useAddToCart();
  const inventory = useInventory();
  const { featuredColumns, faqItems } = useStorefront();
  const [openFAQ, setOpenFAQ] = React.useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[var(--bg)] font-sans relative">
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

          <FeaturedProductsGrid
            inventory={inventory}
            featuredColumns={featuredColumns}
            renderItem={(appliance) => (
              <ProductCard
                appliance={appliance}
                onAddToCart={handleAddToCart}
                added={addedIds[appliance.id]}
              />
            )}
          />
        </section>

        <FeaturedBrands />

        <GoogleReviews />

        <section id="faq" className="mx-auto mt-24 mb-12 max-w-5xl px-6">
          <div className="mb-12 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-black">
              Frequently Asked Questions
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {faqItems.map((faq, i) => (
              <div key={faq.id} className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
                <button
                  onClick={() => setOpenFAQ(openFAQ === i ? null : i)}
                  aria-expanded={openFAQ === i}
                  className="flex w-full items-center justify-between p-5 text-left transition-colors hover:bg-neutral-50 focus:outline-none"
                >
                  <h3 className="pr-4 text-sm font-semibold text-black">{faq.question}</h3>
                  <svg className={`h-4 w-4 shrink-0 text-black/50 transition-transform duration-300 ${openFAQ === i ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFAQ === i && (
                  <div className="px-5 pb-5">
                    <p className="border-t border-neutral-100 pt-3 text-xs leading-relaxed text-black">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
