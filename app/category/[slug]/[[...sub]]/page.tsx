import { notFound } from "next/navigation";
import type { Metadata } from "next";
import CategoryCatalog from "../../../components/CategoryCatalog";
import { getSubcategory } from "../../../data/categories";
import { getCategoryBySlugFromDb } from "../../../lib/categories.server";
import { buildPageMetadata } from "../../../lib/seo";
import { getSeoContext } from "../../../lib/seo.server";
import { categoryMetaFallback, subcategoryMetaFallback } from "../../../lib/seo-fallbacks";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string; sub?: string[] }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, sub } = await params;
  const category = await getCategoryBySlugFromDb(slug);
  if (!category) {
    return buildPageMetadata({
      title: "Category Not Found",
      description: "This category could not be found.",
      noIndex: true,
    });
  }

  const subSlug = sub?.[0];
  const subcategory = getSubcategory(slug, subSlug, category);
  const ctx = await getSeoContext();

  if (subcategory) {
    const fallback = subcategoryMetaFallback(subcategory, category, ctx);
    return buildPageMetadata({
      title: subcategory.metaTitle?.trim() || fallback.title,
      description: subcategory.metaDescription?.trim() || fallback.description,
      path: `/category/${slug}/${subSlug}`,
      siteName: ctx.siteName,
      defaultOgImage: ctx.defaultOgImage,
    });
  }

  const fallback = categoryMetaFallback(category, ctx);
  return buildPageMetadata({
    title: category.metaTitle?.trim() || fallback.title,
    description: category.metaDescription?.trim() || fallback.description,
    path: `/category/${slug}`,
    siteName: ctx.siteName,
    defaultOgImage: ctx.defaultOgImage,
  });
}

export default async function CategoryPage({ params }: Props) {
  const { slug, sub } = await params;
  const category = await getCategoryBySlugFromDb(slug);

  if (!category) notFound();

  const subSlug = sub?.[0];

  return <CategoryCatalog category={category} subSlug={subSlug} />;
}
