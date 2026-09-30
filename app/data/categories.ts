export type SubCategory = {
  label: string;
  slug: string;
  href?: string;
  /** Admin override; null or absent means the generated fallback is used. */
  metaTitle?: string | null;
  metaDescription?: string | null;
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
    label: "Cooking",
    slug: "cooking",
    navLabel: "Cooking",
    description: "Professional ovens, rangetops, and smart cooking suites.",
    subcategories: [
      { label: "Ovens & Ranges", slug: "ovens-ranges" },
      { label: "Rangetops", slug: "rangetops" },
      { label: "Cooktops", slug: "cooktops" },
      { label: "Microwaves", slug: "microwaves" },
    ],
  },
  {
    label: "Refrigeration",
    slug: "refrigeration",
    navLabel: "Refrigeration",
    description: "Refrigerators, wine cellars, and precision cooling systems.",
    subcategories: [
      { label: "Refrigerators", slug: "refrigerators" },
      { label: "Wine Cellars", slug: "wine-cellars" },
      { label: "Freezers", slug: "freezers" },
    ],
  },
  {
    label: "Cleaning",
    slug: "cleaning",
    navLabel: "Cleaning",
    description: "Quiet dishwashers and premium cleaning appliances.",
    subcategories: [
      { label: "Dishwashers", slug: "dishwashers" },
      { label: "Laundry", slug: "laundry" },
      { label: "Vacuums", slug: "vacuums" },
    ],
  },
  {
    label: "Coffee Tech",
    slug: "coffee-tech",
    navLabel: "Coffee",
    description: "Espresso engines, grinders, and barista-grade brewers.",
    subcategories: [
      { label: "Espresso Machines", slug: "espresso-machines" },
      { label: "Grinders", slug: "grinders" },
      { label: "Brewers", slug: "brewers" },
    ],
  },
];

/** All categories shown in the header nav (Gym first) */
export const NAV_CATEGORIES: Category[] = [GYM_CATEGORY, ...CATEGORIES];

/** Every browsable category including Gym */
export const ALL_CATEGORIES: Category[] = NAV_CATEGORIES;

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
