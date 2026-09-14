"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getCategorySlug, getSubcategoryLabel, categoryHref } from "../../data/categories";
import { useCart } from "../../context/CartContext";
import { useInventory } from "../../context/ProductsContext";
import { fetchProductByParamClient, type Appliance } from "../../lib/inventory";
import { productHref } from "../../data/products";
import { formatPrice } from "../../lib/formatPrice";
import { buildWhatsAppUrl } from "../../lib/whatsapp";
import {
  getProductGallery,
  getProductDetailImage,
  getProductThumbnail,
  PRODUCT_IMAGE_SIZES,
} from "../../lib/productImages";
import ProductCard from "../../components/ProductCard";
import QuantitySelector from "../../components/QuantitySelector";
import TrustBadges from "../../components/TrustBadges";
import { ShoppingCart, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import {
  descriptionLooksLikeHtml,
  sanitizeDescriptionHtml,
} from "../../lib/descriptionHtml";

function ProductDescriptionBody({ text }: { text: string }) {
  if (descriptionLooksLikeHtml(text)) {
    return (
      <div
        className="product-description w-full text-sm text-neutral-600 [&_b]:font-bold [&_strong]:font-bold [&_i]:italic [&_em]:italic [&_u]:underline [&_p]:mb-3 [&_p]:min-h-[1.25em] [&_p:last-child]:mb-0 [&_div]:mb-3 [&_div]:min-h-[1.25em] [&_div:last-child]:mb-0"
        dangerouslySetInnerHTML={{ __html: sanitizeDescriptionHtml(text) }}
      />
    );
  }

  return (
    <div className="w-full whitespace-pre-wrap text-sm text-neutral-600">
      {text}
    </div>
  );
}

export default function ProductPage() {
  const { id } = useParams();
  const router = useRouter();
  const param = typeof id === "string" ? id : Array.isArray(id) ? id[0] : "";
  const { addItem } = useCart();
  const inventory = useInventory();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [product, setProduct] = useState<Appliance | null | undefined>(undefined);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!param) {
      setProduct(null);
      return;
    }
    let cancelled = false;
    fetchProductByParamClient(param).then((loaded) => {
      if (cancelled) return;
      setProduct(loaded);
      if (loaded) setActiveIndex(0);
    });
    return () => {
      cancelled = true;
    };
  }, [param]);

  useEffect(() => {
    if (product?.slug && /^\d+$/.test(param)) {
      router.replace(productHref(product));
    }
  }, [product, param, router]);

  if (product === undefined) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <p className="text-sm text-neutral-500">Loading product…</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-neutral-900">Product Not Found</h1>
          <Link href="/" className="mt-4 inline-block text-emerald-600 hover:underline font-semibold">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

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

  const whatsappUrl = buildWhatsAppUrl(`I'm interested in the ${product.name} (Quantity: ${qty})`);

  const relatedProducts = inventory.filter(
    (p) => p.category === product.category && p.id !== product.id
  ).slice(0, 5);

  const categorySlug = getCategorySlug(product.category);
  const showSubcategoryCrumb =
    product.subcategory.toLowerCase() !== categorySlug.toLowerCase();

  return (
    <div className="min-h-screen bg-[var(--bg)] font-sans pb-24">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <nav className="mb-12 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-bold uppercase tracking-widest text-neutral-500">
          <Link href="/" className="hover:text-neutral-900 transition">Home</Link>
          <span className="text-neutral-400">/</span>
          <Link href={`/category/${categorySlug}`} className="hover:text-neutral-900 transition">
            {product.category}
          </Link>
          {showSubcategoryCrumb ? (
            <>
              <span className="text-neutral-400">/</span>
              <Link
                href={categoryHref(categorySlug, product.subcategory)}
                className="hover:text-neutral-900 transition"
              >
                {getSubcategoryLabel(categorySlug, product.subcategory)}
              </Link>
            </>
          ) : null}
          <span className="text-neutral-400">/</span>
          <span className="min-w-0 max-w-full text-neutral-900 sm:line-clamp-2">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 w-full">
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-neutral-200/60 bg-neutral-50 shadow-inner group">
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
                    className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-neutral-200/80 bg-white/90 text-neutral-800 shadow-md transition hover:bg-white"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    type="button"
                    onClick={() => showGalleryImage(safeIndex + 1)}
                    aria-label="Next image"
                    className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-neutral-200/80 bg-white/90 text-neutral-800 shadow-md transition hover:bg-white"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide w-full">
              {gallery.map((img, idx) => (
                <div
                  key={idx}
                  onClick={() => setActiveIndex(idx)}
                  className={`h-20 w-20 shrink-0 cursor-pointer overflow-hidden rounded-xl border-2 p-1 transition-all duration-200 ${
                    safeIndex === idx
                      ? "border-neutral-900 bg-neutral-50 shadow-md"
                      : "border-transparent bg-neutral-50 opacity-70 hover:border-neutral-300 hover:opacity-100"
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
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-7 flex flex-col pt-2 lg:pt-8 w-full">
            <h1 className="text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight leading-tight">
              {product.name}
            </h1>
            <div className="mt-6 flex items-baseline gap-4">
              <span className="text-3xl font-light tracking-tighter text-neutral-900">
                {formatPrice(product.price)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-x-12 gap-y-8 my-10">
              <div>
                <span className="block text-[10px] font-black uppercase tracking-widest text-neutral-500">Category</span>
                <span className="block mt-1.5 text-sm font-semibold text-neutral-900">{product.category}</span>
              </div>
              <div>
                <span className="block text-[10px] font-black uppercase tracking-widest text-neutral-500">Brand</span>
                <span className="block mt-1.5 text-sm font-semibold text-neutral-900">{product.brand}</span>
              </div>
              <div>
                <span className="block text-[10px] font-black uppercase tracking-widest text-neutral-500">Availability</span>
                <span className="block mt-1.5 text-sm font-semibold text-neutral-900">{product.status}</span>
              </div>
              <div>
                <span className="block text-[10px] font-black uppercase tracking-widest text-neutral-500">Authenticity</span>
                <span className="flex items-center gap-1.5 mt-1.5 text-sm font-semibold text-neutral-900">
                  <CheckCircle2 size={16} className="text-neutral-900" />
                  100% Genuine
                </span>
              </div>
            </div>

            <div className="h-px w-full bg-neutral-300/70"></div>

            <div className="my-8">
              <TrustBadges />
            </div>

            <div className="h-px w-full bg-neutral-300/70"></div>

            <div className="flex flex-col sm:flex-row gap-4 items-center mt-6">
              <QuantitySelector qty={qty} onChange={setQty} variant="pill" />

              <div className="flex w-full sm:w-auto gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={added}
                  className={`flex-1 flex items-center justify-center gap-2 px-6 h-11 rounded-full font-bold uppercase tracking-widest text-[10px] transition active:scale-[0.98] shadow-lg ${
                    added
                      ? "bg-emerald-500 text-white shadow-emerald-500/20"
                      : "bg-neutral-900 hover:bg-black text-white shadow-neutral-900/10"
                  }`}
                >
                  <ShoppingCart size={14} />
                  {added ? "Added!" : "Add to Cart"}
                </button>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-11 h-11 flex items-center justify-center bg-transparent border-2 border-[#25D366] text-[#25D366] rounded-full hover:bg-[#25D366] hover:text-white transition active:scale-[0.95] shrink-0"
                  title="WhatsApp inquiry"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        {product.description.trim() ? (
          <div className="mt-16 w-full">
            <h4 className="mb-8 text-[10px] font-black uppercase tracking-widest text-neutral-500">
              Product Description
            </h4>
            <ProductDescriptionBody text={product.description} />
          </div>
        ) : null}

        {/*
        <div className="mt-24 max-w-4xl">
          <h2 className="text-3xl font-black text-neutral-900 mb-8 uppercase tracking-tight">
            Why {product.name}
          </h2>
          <ul className="list-none space-y-4 pl-0">
            {product.highlights.map((highlight) => (
              <li key={highlight} className="flex items-center gap-3">
                <CheckCircle2 size={18} className="text-neutral-900 shrink-0" />
                <span className="font-medium text-neutral-800">{highlight}</span>
              </li>
            ))}
          </ul>
        </div>
        */}

        {relatedProducts.length > 0 && (
          <div className="mt-24 pt-12 border-t border-neutral-300/70 w-full">
            <div className="mb-8">
              <h2 className="text-2xl font-bold tracking-tight text-neutral-950">Related Collections</h2>
              <p className="text-sm text-neutral-500 mt-1">
                Complete your space with complementary {product.category.toLowerCase()} appliances.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-x-5 gap-y-8 lg:grid-cols-4">
              {relatedProducts.map((rp) => (
                <ProductCard key={rp.id} appliance={rp} compact />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
