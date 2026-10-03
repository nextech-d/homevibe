"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { StockStatus } from "@prisma/client";
import type { AdminProductDetail, BrandOption, SubcategoryOption } from "../../lib/products.server";

const STOCK_OPTIONS: { value: StockStatus; label: string }[] = [
  { value: "in_stock", label: "In stock" },
  { value: "low_stock", label: "Low stock" },
  { value: "out_of_stock", label: "Out of stock" },
];

type ProductFormProps = {
  brands: BrandOption[];
  subcategories: SubcategoryOption[];
  product?: AdminProductDetail;
};

export default function ProductForm({ brands, subcategories, product }: ProductFormProps) {
  const router = useRouter();
  const isEdit = Boolean(product);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [brandId, setBrandId] = useState(product?.brandId ?? brands[0]?.id ?? 0);
  const [subcategoryId, setSubcategoryId] = useState(
    product?.subcategoryId ?? subcategories[0]?.id ?? 0
  );
  const [priceKes, setPriceKes] = useState(String(product?.priceKes ?? ""));
  const [stockStatus, setStockStatus] = useState<StockStatus>(product?.stockStatus ?? "in_stock");
  const [isPublished, setIsPublished] = useState(product?.isPublished ?? true);
  const [specs, setSpecs] = useState(product?.specs ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [highlights, setHighlights] = useState(product?.highlights.join("\n") ?? "");
  const [claimsChecked, setClaimsChecked] = useState(Boolean(product?.claimsCheckedAt));
  const [primaryPhotoId, setPrimaryPhotoId] = useState(product?.primaryPhotoId ?? "");
  const [galleryPhotoIds, setGalleryPhotoIds] = useState(
    product?.galleryPhotoIds.join(", ") ?? ""
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const body = {
      id: product?.id,
      name,
      slug: slug || undefined,
      brandId: Number(brandId),
      subcategoryId: Number(subcategoryId),
      priceKes: Number(priceKes),
      stockStatus,
      isPublished,
      specs,
      description,
      highlights,
      claimsChecked,
      primaryPhotoId,
      galleryPhotoIds,
    };

    try {
      const res = await fetch("/api/admin/products", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (data.success) {
        router.push("/admin/products");
        router.refresh();
        return;
      }

      setError(data.message || "Save failed.");
    } catch {
      setError("Save failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-neutral-300 bg-transparent px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-neutral-900";
  const labelClass = "mb-1.5 block text-[10px] font-black uppercase tracking-widest text-neutral-400";

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-5 rounded-3xl border border-neutral-200/60 bg-white p-6 md:p-8">
      {error && <p className="text-xs font-semibold text-red-600">{error}</p>}

      <div>
        <label className={labelClass}>Name *</label>
        <input required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
      </div>

      <div>
        <label className={labelClass}>Slug (optional)</label>
        <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="auto-generated from name" className={inputClass} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Brand *</label>
          <select required value={brandId} onChange={(e) => setBrandId(Number(e.target.value))} className={inputClass}>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Subcategory *</label>
          <select required value={subcategoryId} onChange={(e) => setSubcategoryId(Number(e.target.value))} className={inputClass}>
            {subcategories.map((s) => (
              <option key={s.id} value={s.id}>{s.categoryLabel} — {s.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Price (KES) *</label>
          <input required type="number" min={0} value={priceKes} onChange={(e) => setPriceKes(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Stock status</label>
          <select value={stockStatus} onChange={(e) => setStockStatus(e.target.value as StockStatus)} className={inputClass}>
            {STOCK_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      <label className="flex items-center gap-2 text-xs text-neutral-700">
        <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} />
        Published on storefront
      </label>

      <div>
        <label className={labelClass}>Specs</label>
        <input value={specs} onChange={(e) => setSpecs(e.target.value)} placeholder="Convection • AI Assist • Matte Black" className={inputClass} />
      </div>

      <div>
        <label className={labelClass}>Description *</label>
        <textarea required rows={4} value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} />
      </div>

      <div>
        <label className={labelClass}>Highlights (one per line)</label>
        <textarea rows={4} value={highlights} onChange={(e) => setHighlights(e.target.value)} className={inputClass} />
      </div>

      {/* The publish guard refuses copy promising contents nobody has checked;
          this is the acknowledgement that someone has. */}
      <div>
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={claimsChecked}
            onChange={(e) => setClaimsChecked(e.target.checked)}
            className="mt-1"
          />
          <span>
            Promises checked
            <span className="mt-1 block text-xs text-neutral-500">
              Tick only if you have opened a carton or read the manufacturer&apos;s spec
              sheet for the contents and accessories this copy promises.
            </span>
          </span>
        </label>
      </div>

      <div>
        <label className={labelClass}>Primary image URL or Unsplash photo id *</label>
        <input required value={primaryPhotoId} onChange={(e) => setPrimaryPhotoId(e.target.value)} placeholder="photo-1544816155-12df9643f363 or https://..." className={inputClass} />
      </div>

      <div>
        <label className={labelClass}>Gallery (comma-separated URLs or photo ids)</label>
        <textarea rows={2} value={galleryPhotoIds} onChange={(e) => setGalleryPhotoIds(e.target.value)} className={inputClass} />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded-full bg-neutral-900 px-8 py-3.5 text-xs font-bold uppercase tracking-widest text-white hover:bg-black disabled:opacity-50"
      >
        {loading ? "Saving..." : isEdit ? "Update product" : "Create product"}
      </button>
    </form>
  );
}
