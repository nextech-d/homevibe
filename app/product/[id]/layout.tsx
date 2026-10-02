import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getPublishedProductByParam } from "../../lib/inventory.server";
import { buildPageMetadata, absoluteUrl } from "../../lib/seo";
import { getSeoContext } from "../../lib/seo.server";
import { productMetaFallback } from "../../lib/seo-fallbacks";
import { getProductDetailImage } from "../../lib/productImages";
import { productHref } from "../../data/products";
import { categoryHref, getCategorySlug, getSubcategoryLabel } from "../../data/categories";
import BreadcrumbJsonLd from "../../components/BreadcrumbJsonLd";
import ProductOpenGraph from "../../components/ProductOpenGraph";
import FaqJsonLd from "../../components/FaqJsonLd";
import type { Crumb } from "../../lib/breadcrumbs";
import { serializeJsonLd } from "../../lib/json-ld";
import { isOutOfStock } from "../../lib/inventory";

type Props = {
  params: Promise<{ id: string }>;
  children: ReactNode;
};

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const product = id ? await getPublishedProductByParam(id) : null;
  if (!product) {
    return buildPageMetadata({
      title: "Product Not Found",
      description: "This product could not be found.",
      noIndex: true,
    });
  }

  const ctx = await getSeoContext();
  const fallback = productMetaFallback(product, ctx);

  return buildPageMetadata({
    title: product.metaTitle?.trim() || fallback.title,
    description: product.metaDescription?.trim() || fallback.description,
    path: productHref(product),
    image: getProductDetailImage(product),
    siteName: ctx.siteName,
    defaultOgImage: ctx.defaultOgImage,
    ogType: "product",
  });
}

export default async function ProductLayout({ children, params }: Props) {
  const { id } = await params;
  const product = id ? await getPublishedProductByParam(id) : undefined;

  if (product?.slug && /^\d+$/.test(id)) {
    redirect(productHref(product));
  }

  // Mirrors the visible trail in page.tsx exactly - same slug helpers, same
  // rule for when the subcategory crumb is shown.
  const crumbs: Crumb[] = [];
  if (product) {
    const categorySlug = getCategorySlug(product.category);
    crumbs.push({ name: "Home", path: "/" });
    crumbs.push({ name: product.category, path: categoryHref(categorySlug) });

    if (product.subcategory.toLowerCase() !== categorySlug.toLowerCase()) {
      crumbs.push({
        name: getSubcategoryLabel(categorySlug, product.subcategory),
        path: categoryHref(categorySlug, product.subcategory),
      });
    }

    crumbs.push({ name: product.name });
  }

  const jsonLd = product
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description: product.metaDescription?.trim() || product.description,
        image: getProductDetailImage(product),
        brand: { "@type": "Brand", name: product.brand },
        sku: String(product.id),
        offers: {
          "@type": "Offer",
          url: absoluteUrl(productHref(product)),
          priceCurrency: "KES",
          price: product.price,
          availability: isOutOfStock(product)
            ? "https://schema.org/OutOfStock"
            : "https://schema.org/InStock",
        },
      }
    : null;

  return (
    <>
      {product && <ProductOpenGraph product={product} />}
      {product?.faqs && product.faqs.length > 0 && (
        <FaqJsonLd items={product.faqs} url={absoluteUrl(productHref(product))} />
      )}
      <BreadcrumbJsonLd crumbs={crumbs} />
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
        />
      )}
      {children}
    </>
  );
}
