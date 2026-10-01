import { notFound } from "next/navigation";
import type { Metadata } from "next";
import CategoryCatalog from "../../../components/CategoryCatalog";
import { categoryHref, getSubcategory } from "../../../data/categories";
import BreadcrumbJsonLd from "../../../components/BreadcrumbJsonLd";
import CollectionJsonLd from "../../../components/CollectionJsonLd";
import type { Crumb } from "../../../lib/breadcrumbs";
import { getCategoryBySlugFromDb } from "../../../lib/categories.server";
import { getInventory } from "../../../lib/inventory.server";
import { productsInCategory, productsInSubcategory, toCatalogProduct } from "../../../lib/inventory";
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
  const [category, inventory] = await Promise.all([
    getCategoryBySlugFromDb(slug),
    getInventory(),
  ]);

  if (!category) notFound();

  const subSlug = sub?.[0];
  const subcategory = getSubcategory(slug, subSlug, category);

  // Selected here rather than in the grid, so the products are in the initial
  // HTML instead of arriving with the client inventory fetch.
  const products = productsInSubcategory(
    productsInCategory(inventory, category.label),
    subSlug
  ).map(toCatalogProduct);

  // Mirrors the visible trail in CategoryCatalog: the category is a link only
  // once a subcategory sits below it.
  const crumbs: Crumb[] = [{ name: "Home", path: "/" }];
  if (subcategory) {
    crumbs.push({ name: category.label, path: categoryHref(category.slug) });
    crumbs.push({ name: subcategory.label });
  } else {
    crumbs.push({ name: category.label });
  }

  // Mirrors the <h1> CategoryCatalog renders.
  const heading = subcategory ? subcategory.label : `${category.label} Collection`;

  return (
    <>
      <BreadcrumbJsonLd crumbs={crumbs} />
      <CollectionJsonLd
        name={heading}
        path={subcategory ? `/category/${slug}/${subSlug}` : categoryHref(category.slug)}
        description={category.description}
        products={products}
      />
      <CategoryCatalog category={category} subSlug={subSlug} products={products} />
    </>
  );
}
