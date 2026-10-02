export type SubCategory = {
  label: string;
  slug: string;
  href?: string;
  /** Admin override; null or absent means the generated fallback is used. */
  metaTitle?: string | null;
  metaDescription?: string | null;
  /**
   * Published products in this subcategory, counted when the list comes from
   * the database. Absent on the static fallback below, which has no way to
   * know - so absent means "show it".
   */
  productCount?: number;
};

export type Category = {
  label: string;
  slug: string;
  navLabel: string;
  description: string;
  /** Admin override; null or absent means the generated fallback is used. */
  metaTitle?: string | null;
  metaDescription?: string | null;
  subcategories: SubCategory[];
};

/** Gym equipment category */
export const GYM_CATEGORY: Category = {
  label: "Gym",
  slug: "gym",
  navLabel: "Gym",
  description: "Premium cardio, strength, and home gym equipment for every fitness space.",
  subcategories: [
    { label: "Cardio Equipment", slug: "cardio" },
    { label: "Strength Training", slug: "strength" },
    { label: "Home Gym Systems", slug: "home-gym" },
    { label: "Free Weights & Racks", slug: "weights-racks" },
    { label: "Commercial Gym", slug: "commercial" },
  ],
};

export const CATEGORIES: Category[] = [
  {
    label: "Kitchen",
    slug: "kitchen",
    navLabel: "Kitchen",
    description:
      "Ovens, cooktops, microwaves, fridges, freezers and coffee machines for the whole kitchen.",
    subcategories: [
      { label: "Ovens & Ranges", slug: "ovens-ranges" },
      { label: "Rangetops", slug: "rangetops" },
      { label: "Cooktops", slug: "cooktops" },
      { label: "Microwaves", slug: "microwaves" },
      { label: "Refrigerators", slug: "refrigerators" },
      { label: "Freezers", slug: "freezers" },
      { label: "Water Dispensers", slug: "water-dispensers" },
      { label: "Wine Cellars", slug: "wine-cellars" },
      { label: "Dishwashers", slug: "dishwashers" },
      { label: "Espresso Machines", slug: "espresso-machines" },
      { label: "Grinders", slug: "grinders" },
      { label: "Brewers", slug: "brewers" },
    ],
  },
  {
    label: "Cleaning",
    slug: "cleaning",
    navLabel: "Cleaning",
    description: "Washing machines and premium cleaning appliances.",
    subcategories: [
      { label: "Laundry", slug: "laundry" },
      { label: "Vacuums", slug: "vacuums" },
    ],
  },
];

/** All categories shown in the header nav (Gym first) */
export const NAV_CATEGORIES: Category[] = [GYM_CATEGORY, ...CATEGORIES];

/** Every browsable category including Gym */
export const ALL_CATEGORIES: Category[] = NAV_CATEGORIES;

/**
 * Subcategories worth linking to: one with no published products is a dead end
 * for a shopper and a thin page for Google. Shared by the nav, the category
 * page's own sub-nav and the sitemap so the three cannot disagree. A count of
 * undefined means the list came from the static fallback, which knows no
 * counts - those are shown.
 */
export function visibleSubcategories(category: Category): SubCategory[] {
  return category.subcategories.filter((sub) => sub.productCount !== 0);
}

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];

export function getCategoryBySlug(slug: string | string[] | undefined) {
  const normalized = Array.isArray(slug) ? slug[0] : slug;
  if (!normalized) return undefined;
  return ALL_CATEGORIES.find((c) => c.slug === normalized.toLowerCase());
}

export function getCategoryLabel(slug: string | string[] | undefined): string {
  return getCategoryBySlug(slug)?.label ?? "";
}

export function getCategorySlug(categoryName: string): string {
  const found = ALL_CATEGORIES.find(
    (c) => c.label.toLowerCase() === categoryName.toLowerCase()
  );
  return found?.slug ?? categoryName.toLowerCase().replace(/\s+/g, "-");
}

export function getSubcategory(
  categorySlug: string,
  subSlug: string | undefined,
  categoryOverride?: Category
): SubCategory | undefined {
  if (!subSlug) return undefined;
  const category = categoryOverride ?? getCategoryBySlug(categorySlug);
  return category?.subcategories.find((s) => s.slug === subSlug);
}

export function getSubcategoryLabel(
  categorySlug: string,
  subSlug: string,
  categoryOverride?: Category
): string {
  return getSubcategory(categorySlug, subSlug, categoryOverride)?.label ?? subSlug;
}

export function categoryHref(categorySlug: string, subSlug?: string): string {
  return subSlug
    ? `/category/${categorySlug}/${subSlug}`
    : `/category/${categorySlug}`;
}

export function subcategoryHref(category: Category, sub: SubCategory): string {
  return sub.href ?? categoryHref(category.slug, sub.slug);
}

export function getSubcategorySlug(subcategoryName: string, categorySlug: string): string {
  const category = getCategoryBySlug(categorySlug);
  const found = category?.subcategories.find(
    (s) => s.label.toLowerCase() === subcategoryName.toLowerCase()
  );
  return found?.slug ?? subcategoryName.toLowerCase().replace(/\s+/g, "-");
}
