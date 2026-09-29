import { notFound } from "next/navigation";
import type { Metadata } from "next";
import BrandCatalog from "../../components/BrandCatalog";
import { buildPageMetadata } from "../../lib/seo";
import { getSeoContext } from "../../lib/seo.server";
import { brandMetaFallback } from "../../lib/seo-fallbacks";
import { getBrandBySlugFromDb } from "../../lib/brands.server";

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
  const brand = await getBrandBySlugFromDb(slug);
  if (!brand) notFound();

  return <BrandCatalog brand={brand} />;
}
