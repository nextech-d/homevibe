import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getPublishedProductByParam } from "../../lib/inventory.server";
import { buildPageMetadata, absoluteUrl } from "../../lib/seo";
import { getSeoContext } from "../../lib/seo.server";
import { productMetaFallback } from "../../lib/seo-fallbacks";
import { getProductDetailImage } from "../../lib/productImages";
import { productHref } from "../../data/products";

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
  });
}

export default async function ProductLayout({ children, params }: Props) {
  const { id } = await params;
  const product = id ? await getPublishedProductByParam(id) : undefined;

  if (product?.slug && /^\d+$/.test(id)) {
    redirect(productHref(product));
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
          availability:
            product.status.toLowerCase().includes("out")
              ? "https://schema.org/OutOfStock"
              : "https://schema.org/InStock",
        },
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {children}
    </>
  );
}
