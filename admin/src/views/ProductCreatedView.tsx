import { useEffect, useState } from "react";
import { api, formatKes, STORE_URL } from "../lib/api";
import CreatedConfirmation from "../components/CreatedConfirmation";
import { productThumbUrl, STOCK_LABELS, type AdminProductDetail } from "../lib/products";

type Props = {
  entityId: string;
  onCreateAnother?: () => void;
};

export default function ProductCreatedView({ entityId, onCreateAnother }: Props) {
  const [product, setProduct] = useState<AdminProductDetail | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<{ product: AdminProductDetail }>(`/admin/products/${entityId}`)
      .then((data) => setProduct(data.product))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load product"));
  }, [entityId]);

  if (error) {
    return <div className="p-8 text-sm text-red-400">{error}</div>;
  }

  if (!product) {
    return <div className="p-8 text-sm text-neutral-500">Loading…</div>;
  }

  return (
    <CreatedConfirmation
      entityType="Product"
      name={product.name}
      listPath="/products"
      editPath={`/products/${product.id}/edit`}
      createAnotherPath={onCreateAnother ? undefined : "/products/new"}
      onCreateAnother={onCreateAnother}
      preview={
        <div className="flex items-center gap-4">
          {product.primaryPhotoId ? (
            <img
              src={productThumbUrl(product.primaryPhotoId)}
              alt=""
              className="h-16 w-16 rounded-lg border border-[#333] object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-[#333] bg-[#0a0a0a] text-[10px] text-neutral-600">
              No image
            </div>
          )}
          <div>
            <p className="font-medium text-white">{product.name}</p>
            <p className="text-xs text-neutral-500">
              {product.brandName} · {product.categoryLabel} / {product.subcategoryLabel}
            </p>
          </div>
        </div>
      }
      rows={[
        { label: "ID", value: `#${product.id}`, mono: true },
        { label: "Slug", value: product.slug, mono: true },
        { label: "Brand", value: product.brandName },
        { label: "Category", value: `${product.categoryLabel} / ${product.subcategoryLabel}` },
        { label: "Price", value: formatKes(product.priceKes) },
        { label: "Stock", value: STOCK_LABELS[product.stockStatus] },
        { label: "Status", value: product.isPublished ? "Published" : "Draft" },
        { label: "Meta title", value: product.metaTitle },
        { label: "Meta description", value: product.metaDescription },
        {
          label: "Gallery",
          value:
            product.galleryPhotoIds.length > 0
              ? `${product.galleryPhotoIds.length} secondary image${product.galleryPhotoIds.length === 1 ? "" : "s"}`
              : null,
        },
        {
          label: "Storefront",
          value: product.isPublished ? (
            <a
              href={`${STORE_URL}/product/${product.slug || product.id}`}
              target="_blank"
              rel="noreferrer"
              className="text-[#00e599] hover:underline"
            >
              View live page
            </a>
          ) : (
            "Not published yet"
          ),
        },
      ]}
    />
  );
}
