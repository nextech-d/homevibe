import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  RefreshCw,
  ExternalLink,
  Sparkles,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { api, STORE_URL } from "../lib/api";
import { productThumbUrl } from "../lib/products";
import { cardOuter } from "../lib/cardSurfaces";
import {
  StorefrontField,
  StorefrontSection,
  StorefrontSaveBar,
  storefrontSelectClass,
  type StorefrontAccent,
} from "../components/StorefrontPanel";

type ProductOption = {
  id: number;
  name: string;
  brand: string | null;
  primaryPhotoId: string;
};

type FeaturedSlot = {
  columnIndex: number;
  topProductId: number;
  bottomProductId: number | null;
  topProduct: { id: number; name: string; primaryPhotoId: string };
  bottomProduct: { id: number; name: string; primaryPhotoId: string } | null;
};

type SlotDraft = {
  columnIndex: number;
  topProductId: string;
  bottomProductId: string;
};

const COLUMN_COUNT = 4;
const COLUMN_ACCENTS: StorefrontAccent[] = ["green", "sky", "violet", "amber"];

function emptyDrafts(): SlotDraft[] {
  return Array.from({ length: COLUMN_COUNT }, (_, columnIndex) => ({
    columnIndex,
    topProductId: "",
    bottomProductId: "",
  }));
}

function productLabel(options: ProductOption[], id: string): string {
  if (!id) return "Not selected";
  const product = options.find((p) => String(p.id) === id);
  if (!product) return "Unknown product";
  return product.brand ? `${product.name} · ${product.brand}` : product.name;
}

export default function FeaturedPage() {
  const [slots, setSlots] = useState<FeaturedSlot[]>([]);
  const [productOptions, setProductOptions] = useState<ProductOption[]>([]);
  const [drafts, setDrafts] = useState<SlotDraft[]>(emptyDrafts);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api<{
        slots: FeaturedSlot[];
        productOptions: ProductOption[];
      }>("/admin/storefront/featured");
      setSlots(data.slots);
      setProductOptions(data.productOptions);

      const next = emptyDrafts();
      for (const slot of data.slots) {
        if (slot.columnIndex >= 0 && slot.columnIndex < COLUMN_COUNT) {
          next[slot.columnIndex] = {
            columnIndex: slot.columnIndex,
            topProductId: String(slot.topProductId),
            bottomProductId: slot.bottomProductId ? String(slot.bottomProductId) : "",
          };
        }
      }
      setDrafts(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load featured layout");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function updateDraft(
    columnIndex: number,
    patch: Partial<Pick<SlotDraft, "topProductId" | "bottomProductId">>
  ) {
    setDrafts((prev) =>
      prev.map((draft) => (draft.columnIndex === columnIndex ? { ...draft, ...patch } : draft))
    );
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const payload = drafts.map((draft) => ({
        columnIndex: draft.columnIndex,
        topProductId: Number(draft.topProductId),
        bottomProductId: draft.bottomProductId ? Number(draft.bottomProductId) : null,
      }));

      if (payload.some((slot) => !Number.isFinite(slot.topProductId))) {
        throw new Error("Each column needs a top product.");
      }

      const data = await api<{ slots: FeaturedSlot[] }>("/admin/storefront/featured", {
        method: "PATCH",
        body: JSON.stringify({ slots: payload }),
      });
      setSlots(data.slots);
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save featured layout");
    } finally {
      setSaving(false);
    }
  }

  const filledColumns = drafts.filter((d) => d.topProductId).length;

  return (
    <div className="p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-white">Featured homepage</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Four columns on the homepage — top product required, optional stacked product below.
            {!loading && (
              <span className="ml-2 rounded-full bg-[#00e599]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#00e599]">
                {filledColumns}/{COLUMN_COUNT} filled
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`${STORE_URL}/#featured-products`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#333] px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-neutral-400 hover:bg-[#1a1a1a] hover:text-white"
          >
            <ExternalLink className="h-3.5 w-3.5" /> View store
          </a>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#333] px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-neutral-400 hover:bg-[#1a1a1a] hover:text-white disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {saved && (
        <div className="mb-6 rounded-lg border border-emerald-900/50 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-400">
          Featured layout saved — refresh the storefront to see changes.
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: COLUMN_COUNT }).map((_, i) => (
            <div key={i} className={`h-56 animate-pulse rounded-xl ${cardOuter}`} />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-2">
            {drafts.map((draft) => {
                const current = slots.find((slot) => slot.columnIndex === draft.columnIndex);
                const accent = COLUMN_ACCENTS[draft.columnIndex] ?? "green";

                return (
                  <StorefrontSection
                    key={draft.columnIndex}
                    title={`Column ${draft.columnIndex + 1}`}
                    description={
                      draft.bottomProductId
                        ? "Stacked layout — top and bottom product"
                        : "Single product column"
                    }
                    icon={Sparkles}
                    accent={accent}
                    badge={`Col ${draft.columnIndex + 1}`}
                    className="!p-4"
                  >
                    <StorefrontField label="Top product" hint="Required — main card in this column.">
                      <select
                        value={draft.topProductId}
                        onChange={(e) =>
                          updateDraft(draft.columnIndex, { topProductId: e.target.value })
                        }
                        className={storefrontSelectClass}
                      >
                        <option value="">Select product…</option>
                        {productOptions.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.brand ? `${product.name} (${product.brand})` : product.name}
                          </option>
                        ))}
                      </select>
                      {current?.topProduct && (
                        <div className="mt-2.5 flex items-center gap-2.5 rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] p-2">
                          <img
                            src={productThumbUrl(current.topProduct.primaryPhotoId)}
                            alt=""
                            className="h-10 w-10 rounded-md border border-[#333] object-cover"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-medium text-neutral-300">
                              {current.topProduct.name}
                            </p>
                            <Link
                              to={`/products/${current.topProduct.id}/edit`}
                              className="text-[10px] text-[#00e599] hover:underline"
                            >
                              Edit product →
                            </Link>
                          </div>
                          <ArrowUp className="h-3.5 w-3.5 shrink-0 text-neutral-600" />
                        </div>
                      )}
                    </StorefrontField>

                    <StorefrontField
                      label="Bottom product"
                      hint="Optional — smaller card stacked below the top product."
                    >
                      <select
                        value={draft.bottomProductId}
                        onChange={(e) =>
                          updateDraft(draft.columnIndex, { bottomProductId: e.target.value })
                        }
                        className={storefrontSelectClass}
                      >
                        <option value="">None</option>
                        {productOptions.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.brand ? `${product.name} (${product.brand})` : product.name}
                          </option>
                        ))}
                      </select>
                      {current?.bottomProduct && (
                        <div className="mt-2.5 flex items-center gap-2.5 rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] p-2">
                          <img
                            src={productThumbUrl(current.bottomProduct.primaryPhotoId)}
                            alt=""
                            className="h-8 w-8 rounded-md border border-[#333] object-cover"
                          />
                          <p className="min-w-0 flex-1 truncate text-xs text-neutral-400">
                            {current.bottomProduct.name}
                          </p>
                          <ArrowDown className="h-3.5 w-3.5 shrink-0 text-neutral-600" />
                        </div>
                      )}
                    </StorefrontField>
                  </StorefrontSection>
                );
              })}
          </div>

          <StorefrontSaveBar
            saving={saving}
            onSave={handleSave}
            label="Save layout"
            preview={
              <>
                Preview:{" "}
                {drafts.map((d, i) => (
                  <span key={d.columnIndex}>
                    {i > 0 && <span className="mx-1.5 text-neutral-700">·</span>}
                    <span className="text-neutral-300">
                      Col {d.columnIndex + 1}: {productLabel(productOptions, d.topProductId)}
                    </span>
                  </span>
                ))}
              </>
            }
          />
        </div>
      )}
    </div>
  );
}
