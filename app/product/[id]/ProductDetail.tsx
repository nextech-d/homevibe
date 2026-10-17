"use client";

import React, { useEffect, useState } from "react";
import { getCategorySlug, getSubcategoryLabel, categoryHref } from "../../data/categories";
import { useCart } from "../../context/CartContext";
import { isOutOfStock, type Appliance, type CatalogProduct } from "../../lib/inventory";
import { formatPrice } from "../../lib/formatPrice";
import { productWhatsAppUrl } from "../../lib/whatsapp";
import { useWhatsAppNumber } from "../../context/WhatsAppContext";
import { PIXEL_CURRENCY, pixelContentId, trackPixel } from "../../lib/pixel";
import {
  getProductGallery,
  getProductDetailImage,
  getProductThumbnail,
  PRODUCT_IMAGE_SIZES,
} from "../../lib/productImages";
import ProductCard from "../../components/ProductCard";
import ProductFaq from "../../components/ProductFaq";
import ProductHighlights from "../../components/ProductHighlights";
import WhyBuyFromUs from "../../components/WhyBuyFromUs";
import QuantitySelector from "../../components/QuantitySelector";
import { brandHref } from "../../data/brands";
import { keepWhole, PinnedProductBar, ProductFacts, ProductTrustPoints } from "./ProductHeaderParts";
import WhatsAppIcon from "../../components/WhatsAppIcon";
import { ShoppingCart, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { renderMarkdown } from "../../lib/markdown";
import Breadcrumbs from "../../components/Breadcrumbs";
import {
  focusRing,
  pageHeading,
  primaryButton,
  raisedSurface,
  raisedSurfaceFromSm,
  secondaryButton,
  sectionHeading,
} from "../../components/homeSurfaces";
/**
 * The description: HTML already sanitised on the server (descriptionHtml),
 * or plain text. This component only renders - the sanitiser and its
 * libraries never reach the browser.
 */
function ProductDescriptionBody({ text, html }: { text: string; html: string | null }) {
  if (html !== null) {
    return (
      <div
        className="product-description w-full text-sm text-neutral-700 [&_b]:font-bold [&_strong]:font-bold [&_i]:italic [&_em]:italic [&_u]:underline [&_p]:mb-3 [&_p]:min-h-[1.25em] [&_p:last-child]:mb-0 [&_div]:mb-3 [&_div]:min-h-[1.25em] [&_div:last-child]:mb-0"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <div className="w-full whitespace-pre-wrap text-sm leading-relaxed text-neutral-700">
      {text}
    </div>
  );
}

/**
 * Interactive half of the product page. The product itself is fetched on the
 * server and handed in, so the markup below is present in the initial HTML
 * rather than appearing only after hydration.
 */
export default function ProductDetail({
  product,
  related,
  addOns,
  descriptionHtml,
}: {
  product: Appliance;
  /** Chosen on the server, so the rail renders with the rest of the page. */
  related: CatalogProduct[];
  /** Configured add-ons for this subcategory, or null when there are none to show. */
  addOns: { heading: string; products: CatalogProduct[] } | null;
  /** The description sanitised on the server, or null when it's plain text. */
  descriptionHtml: string | null;
}) {
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const whatsappNumber = useWhatsAppNumber();

  // Meta's retargeting audiences are built from this: the product someone
  // looked at, not just the page they landed on.
  useEffect(() => {
    trackPixel("ViewContent", {
      content_type: "product",
      content_ids: [pixelContentId(product.id)],
      content_name: product.name,
      content_category: product.category,
      value: product.price,
      currency: PIXEL_CURRENCY,
    });
  }, [product.id, product.name, product.category, product.price]);

  const gallery = getProductGallery(product);
  const safeIndex = gallery.length > 0 ? Math.min(activeIndex, gallery.length - 1) : 0;
  const activeImage = gallery[safeIndex] ?? getProductDetailImage(product);
  const hasGalleryNav = gallery.length > 1;

  function showGalleryImage(index: number) {
    if (gallery.length === 0) return;
    setActiveIndex((index + gallery.length) % gallery.length);
  }

  const handleAddToCart = () => {
    addItem(
      {
        id: product.id,
        name: product.name,
        price: product.price,
        slug: product.slug,
        image: getProductThumbnail(product),
      },
      qty,
      { openDrawer: false }
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const whatsappUrl = productWhatsAppUrl(product, whatsappNumber);
  const outOfStock = isOutOfStock(product);

  const categorySlug = getCategorySlug(product.category);
  const showSubcategoryCrumb =
    product.subcategory.toLowerCase() !== categorySlug.toLowerCase();
  // The facts line names what the product is - "Washing Machines", not the
  // "Cleaning" it's filed under - with the subcategory's own database label.
  const factCategoryLabel = showSubcategoryCrumb
    ? product.subcategoryLabel ?? getSubcategoryLabel(categorySlug, product.subcategory)
    : product.category;
  const factCategoryHref = showSubcategoryCrumb
    ? categoryHref(categorySlug, product.subcategory)
    : categoryHref(categorySlug);

  return (
    <div className="min-h-screen font-sans pb-24">
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Reads as written rather than shouted: a product name in caps -
            "HISENSE 205L DOUBLE DOOR FRIDGE REF205DR (WATER DISPENSER)" - is
            hard to scan and loses the casing the catalogue stores. */}
        <Breadcrumbs
          className="mb-8"
          items={[
            { label: "Home", href: "/" },
            { label: product.category, href: `/category/${categorySlug}` },
            ...(showSubcategoryCrumb
              ? [
                  {
                    label: getSubcategoryLabel(categorySlug, product.subcategory),
                    href: categoryHref(categorySlug, product.subcategory),
                  },
                ]
              : []),
            { label: product.name },
          ]}
        />

        {/* Three blocks on a twelve-column grid. On a phone they stack title and
            price, then the gallery, then the rest, so the name and price are on
            the first screen; from lg the gallery takes the left five columns
            beside both, the title level with the top of the image box. In one
            white panel from 640px up, like the homepage's sections; on a phone
            it sits on the page, full width. The panel's 40px padding leaves
            896px at 1024px, so the gap is 48px there and 64px from xl. The
            first row hugs the title and price; the second takes whatever the
            taller gallery adds, so the price-to-buttons gap stays fixed. */}
        <div className={`${raisedSurfaceFromSm} grid w-full grid-cols-1 gap-6 sm:p-8 lg:grid-cols-12 lg:grid-rows-[auto_1fr] lg:gap-x-12 lg:gap-y-0 lg:p-10 xl:gap-x-16`}>
          <div className="w-full lg:col-span-7 lg:col-start-6 lg:row-start-1">
            <h1 className={pageHeading}>{keepWhole(product.name)}</h1>
            <p className="mt-4 text-3xl font-semibold tabular-nums tracking-tight text-[#8f4710] lg:mt-5">
              {formatPrice(product.price)}
            </p>
          </div>

          <div className="flex flex-col gap-4 lg:col-span-5 lg:col-start-1 lg:row-span-2 lg:row-start-1">
            <div className={`${raisedSurface} group relative aspect-square w-full overflow-hidden`}>
              <Image
                src={activeImage}
                alt={product.name}
                fill
                sizes={PRODUCT_IMAGE_SIZES.detail}
                className="object-contain p-4 transition-transform duration-500 group-hover:scale-105"
                priority
              />
              {hasGalleryNav && (
                <>
                  <button
                    type="button"
                    onClick={() => showGalleryImage(safeIndex - 1)}
                    aria-label="Previous image"
                    className={`absolute left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[#DCE0E7] bg-white/95 text-neutral-800 shadow-md transition hover:border-[#a85414] ${focusRing}`}
                  >
                    <ChevronLeft size={20} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => showGalleryImage(safeIndex + 1)}
                    aria-label="Next image"
                    className={`absolute right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[#DCE0E7] bg-white/95 text-neutral-800 shadow-md transition hover:border-[#a85414] ${focusRing}`}
                  >
                    <ChevronRight size={20} aria-hidden="true" />
                  </button>
                </>
              )}
            </div>

            {/* Real buttons, so the keyboard reaches them; p-1 on the row leaves
                room for the focus ring, which the scroller would otherwise clip. */}
            <div className="flex w-full gap-3 overflow-x-auto p-1 pb-2">
              {gallery.map((img, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setActiveIndex(idx)}
                  aria-label={`Show image ${idx + 1} of ${gallery.length}`}
                  aria-pressed={safeIndex === idx}
                  className={`h-20 w-20 shrink-0 cursor-pointer overflow-hidden rounded-xl border-2 bg-white p-1 transition-all duration-200 ${focusRing} ${
                    safeIndex === idx
                      ? "border-neutral-950 shadow-md"
                      : "border-[#DCE0E7] hover:border-[#a85414]"
                  }`}
                >
                  <div className="relative h-full w-full overflow-hidden rounded-lg">
                    <Image
                      src={img}
                      alt={`${product.name} view ${idx + 1}`}
                      fill
                      sizes={PRODUCT_IMAGE_SIZES.thumbnail}
                      className="object-contain p-1"
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="w-full lg:col-span-7 lg:col-start-6 lg:row-start-2 lg:mt-8">
            <div id="product-actions" className="flex flex-col sm:flex-row gap-4 items-center sm:items-start">
              <QuantitySelector qty={qty} onChange={setQty} variant="pill" />

              {/* Below lg: one column, so WhatsApp sits directly under Add to
                  Cart and both take the width of the wider of the two - it
                  can never outgrow the primary action. From lg: one row,
                  [qty] [Add to Cart] [WhatsApp], both buttons one fixed width
                  (wider than "Ask about availability"); where the column is
                  too narrow for that row (around 1024px), WhatsApp wraps under
                  Add to Cart instead of shrinking. */}
              <div className="flex w-full sm:w-auto flex-col gap-3 lg:min-w-0 lg:flex-1 lg:flex-row lg:flex-wrap">
                <button
                  onClick={handleAddToCart}
                  disabled={added}
                  className={`${
                    added
                      ? `inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-emerald-700 px-6 text-sm font-semibold text-white ${focusRing}`
                      : primaryButton
                  } h-12 w-full active:scale-[0.98] lg:w-60`}
                >
                  <ShoppingCart size={16} aria-hidden="true" />
                  {added ? "Added" : "Add to cart"}
                </button>

                {/* Secondary to Add to Cart, and a real link rather than a
                    scripted button so it can be opened in a new tab, copied or
                    long-pressed like any other. Shown out of stock too - that
                    is exactly when someone wants to ask. */}
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${secondaryButton} h-12 w-full active:scale-[0.98] lg:w-60`}
                >
                  <WhatsAppIcon className="h-4 w-4 shrink-0" />
                  {outOfStock ? "Ask about availability" : "Order on WhatsApp"}
                </a>
              </div>
            </div>

            <div className="mt-6">
              <ProductFacts
                brand={product.brand}
                brandHref={product.brandSlug ? brandHref(product.brandSlug) : undefined}
                category={factCategoryLabel}
                categoryHref={factCategoryHref}
                status={product.status}
              />
            </div>

            <div className="mt-4 border-t border-[#DCE0E7] pt-5">
              <ProductTrustPoints subcategory={product.subcategory} />
            </div>
          </div>
        </div>

        <PinnedProductBar
          watchId="product-actions"
          onAddToCart={handleAddToCart}
          added={added}
          whatsappUrl={whatsappUrl}
          outOfStock={outOfStock}
        />

        {/* One column for both, so the description and the long-form section
            stay matched by construction rather than by two classes agreeing. */}
        <div className="mt-16 w-full">
        {/* The long-form reads on a white panel, across its full width. */}
        {product.description.trim() || product.body?.trim() ? (
          <section
            aria-labelledby="product-description"
            className={`${raisedSurface} px-5 py-8 sm:px-10 sm:py-10`}
          >
            <h2 id="product-description" className={`mb-6 ${sectionHeading}`}>
              Product description
            </h2>
            {product.description.trim() ? (
              <ProductDescriptionBody text={product.description} html={descriptionHtml} />
            ) : null}

            {product.body?.trim() ? (
              // Continues the description rather than starting a new block: small
              // gap, and the renderer's own top margin on the first heading zeroed
              // so the two don't stack up to ~100px of air.
              <div className="mt-6 w-full [&>div>:first-child]:mt-0">
                {/* Markdown, rendered by the same converter the blog uses - which
                    escapes the source before formatting it. */}
                <div dangerouslySetInnerHTML={{ __html: renderMarkdown(product.body) }} />
              </div>
            ) : null}
          </section>
        ) : null}

        <WhyBuyFromUs />
        </div>

        <ProductFaq items={product.faqs ?? []} />

        <ProductHighlights items={product.highlights ?? []} />

        {related.length > 0 && (
          <section className="mt-20 w-full">
            <h2 className={`mb-6 ${sectionHeading}`}>Related Items</h2>
            <div className="grid grid-cols-2 gap-x-5 gap-y-8 lg:grid-cols-4">
              {related.map((rp) => (
                <ProductCard key={rp.id} appliance={rp} compact />
              ))}
            </div>
          </section>
        )}

        {addOns && (
          <section className={`${related.length > 0 ? "mt-14" : "mt-20"} w-full`}>
            <h2 className={`mb-6 ${sectionHeading}`}>{addOns.heading}</h2>
            <div className="grid grid-cols-2 gap-x-5 gap-y-8 lg:grid-cols-4">
              {addOns.products.map((ap) => (
                <ProductCard key={ap.id} appliance={ap} compact />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
