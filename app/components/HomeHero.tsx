"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Bike,
  Coffee,
  CookingPot,
  Dumbbell,
  HeartPulse,
  Refrigerator,
  Sparkles,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import TrustBadges from "./TrustBadges";
import { categoryHref } from "../data/categories";
import { useNavCategories } from "../context/CategoriesContext";
import { useStorefront } from "../context/StorefrontContext";

function HighlightedTagline({ tagline }: { tagline: string }) {
  const match = tagline.match(/^(.*\b)(you)(\b.*)$/i);
  if (!match) return <>{tagline}</>;
  return (
    <>
      {match[1]}
      <span className="font-[family-name:var(--font-playfair)] font-normal italic text-rose-600">
        {match[2]}
      </span>
      {match[3]}
    </>
  );
}

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  gym: Dumbbell,
  cooking: CookingPot,
  refrigeration: Refrigerator,
  cleaning: Sparkles,
  "coffee-tech": Coffee,
};

export default function HomeHero() {
  const { siteSettings } = useStorefront();
  const categories = useNavCategories();

  return (
    <section className="relative mb-12 overflow-hidden rounded-[2rem] border border-neutral-200 bg-[var(--bg)] px-8 py-14 md:px-14 md:py-16">
      <div className="relative flex flex-col gap-8 lg:flex-row lg:items-stretch lg:gap-6">
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex flex-1 items-center">
            <div className="min-w-0 max-w-lg">
              <h1 className="text-4xl font-medium tracking-tight text-neutral-950 md:text-5xl">
                <HighlightedTagline tagline={siteSettings.tagline} />
              </h1>
              <Link
                href="#featured-products"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-neutral-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-black"
              >
                Shop featured
                <ArrowRight className="h-4 w-4" />
              </Link>
              <TrustBadges variant="hero" />
            </div>

            <div aria-hidden className="pointer-events-none hidden flex-1 items-center justify-center lg:flex">
              <div className="grid grid-cols-2 gap-3">
                <div className="translate-y-2 rotate-[-8deg] rounded-2xl border border-neutral-200 bg-white p-3.5 shadow-sm">
                  <Dumbbell className="h-8 w-8 text-neutral-800" strokeWidth={1.6} />
                </div>
                <div className="-translate-y-2 rotate-[7deg] rounded-2xl border border-neutral-200 bg-white p-3.5 shadow-sm">
                  <Bike className="h-8 w-8 text-neutral-800" strokeWidth={1.6} />
                </div>
                <div className="translate-x-1 rotate-[5deg] rounded-2xl border border-neutral-200 bg-white p-3.5 shadow-sm">
                  <HeartPulse className="h-8 w-8 text-neutral-800" strokeWidth={1.6} />
                </div>
                <div className="-translate-x-1 rotate-[-6deg] rounded-2xl border border-neutral-200 bg-white p-3.5 shadow-sm">
                  <Trophy className="h-8 w-8 text-neutral-800" strokeWidth={1.6} />
                </div>
              </div>
            </div>
          </div>

          <nav className="mt-8" aria-label="Shop by category">
            <div className="flex justify-start gap-3">
              {categories.map((category) => {
                const Icon = CATEGORY_ICONS[category.slug] ?? Sparkles;
                return (
                  <Link
                    key={category.slug}
                    href={categoryHref(category.slug)}
                    className="flex w-16 flex-col items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-2 py-2 sm:w-20"
                  >
                    <Icon className="h-5 w-5 text-neutral-800" strokeWidth={1.6} />
                    <span className="text-center text-[10px] font-medium text-neutral-700">
                      {category.navLabel || category.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>

        <div className="relative h-40 w-full shrink-0 overflow-hidden rounded-2xl lg:h-auto lg:min-h-[280px] lg:w-[22rem] lg:self-stretch">
          <Image
            src="https://images.unsplash.com/photo-1556912173-46c336c7fd55?auto=format&fit=crop&w=1200&q=80"
            alt="Modern kitchen with appliances"
            fill
            sizes="(max-width: 1024px) 100vw, 22rem"
            className="object-cover"
            priority
          />
        </div>
      </div>
    </section>
  );
}
