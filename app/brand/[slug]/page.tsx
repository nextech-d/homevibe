import { notFound } from "next/navigation";
import type { Metadata } from "next";
import BrandCatalog from "../../components/BrandCatalog";
import { buildPageMetadata } from "../../lib/seo";
import { getSeoContext } from "../../lib/seo.server";
import { brandMetaFallback } from "../../lib/seo-fallbacks";
import { getBrandBySlugFromDb } from "../../lib/brands.server";
import { getInventory } from "../../lib/inventory.server";
import { productsForBrand, toCatalogProduct } from "../../lib/inventory";
import BreadcrumbJsonLd from "../../components/BreadcrumbJsonLd";

type BrandPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: BrandPageProps): Promise<Metadata> {
  const { slug } = await params;
  const brand = await getBrandBySlugFromDb(slug);
  if (!brand) {
    return buildPageMetadata({
      title: "Brand Not Found",
      description: "This brand could not be found.",
      noIndex: true,
    });
  }

  const ctx = await getSeoContext();
  const fallback = brandMetaFallback(brand, ctx);

  return buildPageMetadata({
    title: brand.metaTitle?.trim() || fallback.title,
    description: brand.metaDescription?.trim() || fallback.description,
    path: `/brand/${slug}`,
    siteName: ctx.siteName,
    defaultOgImage: ctx.defaultOgImage,
  });
}

export default async function BrandPage({ params }: BrandPageProps) {
  const { slug } = await params;
  const [brand, inventory] = await Promise.all([
    getBrandBySlugFromDb(slug),
    getInventory(),
  ]);
  if (!brand) notFound();

  // Selected here rather than in the grid, so the products are in the initial
  // HTML instead of arriving with the client inventory fetch.
  const products = productsForBrand(inventory, brand.name).map(toCatalogProduct);

  return (
    <>
      <BreadcrumbJsonLd
        crumbs={[{ name: "Home", path: "/" }, { name: brand.name }]}
      />
      <BrandCatalog brand={brand} products={products} />
    </>
  );
}
