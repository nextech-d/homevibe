import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, RefreshCw, Plus, Pencil, Package, Trash2 } from "lucide-react";
import { api, formatKes } from "../lib/api";
import { productThumbUrl, type StockStatus } from "../lib/products";
import {
  CatalogStatTile,
  StorefrontSection,
  storefrontInputClass,
  storefrontSelectClass,
} from "../components/StorefrontPanel";
import ProductCreatedView from "../views/ProductCreatedView";

type Product = {
  id: number;
  name: string;
  brand: string;
  priceKes: number;
  stockStatus: StockStatus;
  isPublished: boolean;
  primaryPhotoId: string;
};

type Summary = {
  total: number;
  published: number;
  unpublished: number;
  lowStock: number;
  outOfStock: number;
};

const STOCK_OPTS: { value: StockStatus | ""; label: string }[] = [
  { value: "", label: "All stock" },
  { value: "in_stock", label: "In stock" },
  { value: "low_stock", label: "Low stock" },
  { value: "out_of_stock", label: "Out of stock" },
];

const QUICK_FILTERS = [
  { key: "all", label: "All", stock: "", published: "" },
  { key: "low", label: "Low stock", stock: "low_stock", published: "" },
  { key: "out", label: "Out of stock", stock: "out_of_stock", published: "" },
  { key: "draft", label: "Unpublished", stock: "", published: "false" },
] as const;

export default function ProductsPage() {
  const [searchParams] = useSearchParams();
  const createdId = searchParams.get("created");
  if (createdId) {
    return <ProductCreatedView entityId={createdId} />;
  }
  return <ProductsListPage />;
}

function ProductsListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [searchInput, setSearchInput] = useState(searchParams.get("q") ?? "");

  const stockFilter = searchParams.get("stock") ?? "";
  const publishedFilter = searchParams.get("published") ?? "";
  const brandIdFilter = searchParams.get("brandId") ?? "";
  const subcategoryIdFilter = searchParams.get("subcategoryId") ?? "";

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    const q = searchParams.get("q");
    if (q) params.set("q", q);
    if (stockFilter) params.set("stock", stockFilter);
    if (publishedFilter) params.set("published", publishedFilter);
    if (brandIdFilter) params.set("brandId", brandIdFilter);
    if (subcategoryIdFilter) params.set("subcategoryId", subcategoryIdFilter);
    const s = params.toString();
    return s ? `?${s}` : "";
  }, [searchParams, stockFilter, publishedFilter, brandIdFilter, subcategoryIdFilter]);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      setError("");
      try {
        const data = await api<{ products: Product[]; summary: Summary }>(
          `/admin/products${queryString}`
        );
        setProducts(data.products);
        setSummary(data.summary);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load products");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [queryString]
  );

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const trimmed = searchInput.trim();
    const currentQ = searchParams.get("q") ?? "";
    if (trimmed === currentQ) return;

    const timer = window.setTimeout(() => {
      const next = new URLSearchParams(searchParams);
      if (trimmed) next.set("q", trimmed);
      else next.delete("q");
      setSearchParams(next, { replace: true });
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchInput, searchParams, setSearchParams]);

  function applyQuickFilter(key: string) {
    const filter = QUICK_FILTERS.find((f) => f.key === key);
    if (!filter) return;
    const next = new URLSearchParams();
    const q = searchParams.get("q");
    const brandId = searchParams.get("brandId");
    const subcategoryId = searchParams.get("subcategoryId");
    if (q) next.set("q", q);
    if (brandId) next.set("brandId", brandId);
    if (subcategoryId) next.set("subcategoryId", subcategoryId);
    if (filter.stock) next.set("stock", filter.stock);
    if (filter.published) next.set("published", filter.published);
    setSearchParams(next);
  }

  function activeQuickKey(): string {
    if (publishedFilter === "false" && !stockFilter) return "draft";
    if (stockFilter === "low_stock") return "low";
    if (stockFilter === "out_of_stock") return "out";
    if (!stockFilter && !publishedFilter) return "all";
    return "";
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = searchInput.trim();
    const next = new URLSearchParams(searchParams);
    if (trimmed) next.set("q", trimmed);
    else next.delete("q");
    setSearchParams(next, { replace: true });
  }

  async function quickSaveStock(id: number, stockStatus: StockStatus) {
    const data = await api<{ product: Product }>("/admin/products", {
      method: "PATCH",
      body: JSON.stringify({ id, stockStatus }),
    });
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...data.product } : p)));
  }

  /**
   * Deleting is the only way a test product leaves the catalogue - there was no
   * route for it, so scratch rows had to be removed straight from the database.
   * A product in a featured homepage slot is refused by the API, which says so.
   */
  async function deleteProduct(id: number, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.\n\nPast orders keep the name and price they were sold at.`)) {
      return;
    }
    setError("");
    try {
      await api(`/admin/products/${id}`, { method: "DELETE" });
      setProducts((prev) => prev.filter((p) => p.id !== id));
      await load(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Cannot delete product");
    }
  }

  return (
    <div className="p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-white">Products</h1>
          <p className="mt-1 text-sm text-neutral-500">Catalog management</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => load(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-lg border border-[#333] px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-neutral-400 hover:text-white disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <Link
            to="/products/new"
            className="inline-flex items-center gap-2 rounded-lg bg-[#00e599] px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-black hover:bg-[#00cc88]"
          >
            <Plus className="h-3.5 w-3.5" />
            Add product
          </Link>
        </div>
      </div>

      <StorefrontSection
        className="mt-6"
        title="Overview"
        description="Product counts by status"
        icon={Package}
        accent="green"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {loading && !summary ? (
            <>
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-24 animate-pulse rounded-xl border border-[#333] bg-[#161616]"
                />
              ))}
            </>
          ) : (
            <>
              <CatalogStatTile
                label="Total"
                value={summary?.total ?? 0}
                icon={Package}
                accent="green"
              />
              <CatalogStatTile
                label="Published"
                value={summary?.published ?? 0}
                icon={Package}
                accent="sky"
                valueClassName="text-[#00e599]"
              />
              <CatalogStatTile
                label="Low stock"
                value={summary?.lowStock ?? 0}
                icon={Package}
                accent="amber"
                valueClassName="text-amber-400"
              />
              <CatalogStatTile
                label="Out of stock"
                value={summary?.outOfStock ?? 0}
                icon={Package}
                accent="violet"
                valueClassName="text-red-400"
              />
            </>
          )}
        </div>
      </StorefrontSection>

      <StorefrontSection
        className="mt-6"
        title="Filters"
        description="Quick filters, search, stock, and visibility."
        icon={Search}
        accent="violet"
      >
        <div className="flex flex-wrap items-center gap-3">
          {QUICK_FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => applyQuickFilter(f.key)}
              className={`rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider ${
                activeQuickKey() === f.key
                  ? "bg-[#00e599]/15 text-[#00e599]"
                  : "bg-[#111] text-neutral-500 hover:text-neutral-300"
              }`}
            >
              {f.label}
            </button>
          ))}
          <form onSubmit={handleSearch} className="relative min-w-[200px] flex-1 max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-600" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search name, slug, brand…"
              className={`${storefrontInputClass} pl-10`}
            />
          </form>
          <select
            value={stockFilter}
            onChange={(e) => {
              const next = new URLSearchParams(searchParams);
              if (e.target.value) next.set("stock", e.target.value);
              else next.delete("stock");
              setSearchParams(next);
            }}
            className={`${storefrontSelectClass} w-full min-w-[140px] max-w-xs sm:w-40`}
          >
            {STOCK_OPTS.map((o) => (
              <option key={o.value || "all"} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <select
            value={publishedFilter}
            onChange={(e) => {
              const next = new URLSearchParams(searchParams);
              if (e.target.value) next.set("published", e.target.value);
              else next.delete("published");
              setSearchParams(next);
            }}
            className={`${storefrontSelectClass} w-full min-w-[140px] max-w-xs sm:w-44`}
          >
            <option value="">All visibility</option>
            <option value="true">Published</option>
            <option value="false">Unpublished</option>
          </select>
        </div>
      </StorefrontSection>

      {brandIdFilter && (
        <div className="mt-4 flex items-center gap-2 text-xs text-neutral-400">
          <span>Filtered by brand</span>
          <button
            type="button"
            onClick={() => {
              const next = new URLSearchParams(searchParams);
              next.delete("brandId");
              setSearchParams(next);
            }}
            className="rounded-full bg-[#111] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-500 hover:text-white"
          >
            Clear
          </button>
        </div>
      )}

      {subcategoryIdFilter && (
        <div className="mt-4 flex items-center gap-2 text-xs text-neutral-400">
          <span>Filtered by subcategory</span>
          <button
            type="button"
            onClick={() => {
              const next = new URLSearchParams(searchParams);
              next.delete("subcategoryId");
              setSearchParams(next);
            }}
            className="rounded-full bg-[#111] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-500 hover:text-white"
          >
            Clear
          </button>
        </div>
      )}

      {error && (
        <p className="mt-4 rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">
          {error}
        </p>
      )}

      <StorefrontSection
        className="mt-6"
        title="All products"
        description={
          !loading && summary
            ? `Showing ${products.length} of ${summary.total}`
            : "Browse and manage your product catalog"
        }
        icon={Package}
        accent="amber"
        badge={summary && !loading ? String(products.length) : undefined}
      >
        <div className="overflow-hidden rounded-xl border border-[#262626]">
          {loading ? (
            <div className="space-y-0 divide-y divide-[#262626] bg-[#0a0a0a] p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex animate-pulse gap-4 py-4">
                  <div className="h-10 w-10 rounded-lg bg-[#222]" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-1/3 rounded bg-[#222]" />
                    <div className="h-3 w-1/4 rounded bg-[#222]" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="bg-[#0a0a0a] px-6 py-16 text-center text-sm text-neutral-500">
              No products match your filters.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-[#111111] text-[10px] uppercase tracking-wider text-neutral-500">
                <tr>
                  <th className="w-12 px-4 py-3"></th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Brand</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Stock</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262626] bg-[#0a0a0a]">
                {products.map((product) => (
                  <ProductRow
                    key={product.id}
                    product={product}
                    onStockChange={quickSaveStock}
                    onDelete={deleteProduct}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </StorefrontSection>
    </div>
  );
}

function ProductRow({
  product,
  onStockChange,
  onDelete,
}: {
  product: Product;
  onStockChange: (id: number, stockStatus: StockStatus) => Promise<void>;
  onDelete: (id: number, name: string) => Promise<void>;
}) {
  const [togglingStock, setTogglingStock] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const inStock = product.stockStatus !== "out_of_stock";

  async function toggleStock() {
    setTogglingStock(true);
    try {
      await onStockChange(
        product.id,
        inStock ? "out_of_stock" : "in_stock"
      );
    } finally {
      setTogglingStock(false);
    }
  }

  return (
    <tr className="text-neutral-300">
      <td className="px-4 py-3">
        <img
          src={productThumbUrl(product.primaryPhotoId)}
          alt=""
          className="h-10 w-10 rounded-lg border border-[#333] object-cover"
        />
      </td>
      <td className="px-4 py-3">
        <Link
          to={`/products/${product.id}/edit`}
          className="font-medium text-white hover:text-[#00e599] hover:underline"
        >
          {product.name}
        </Link>
        <div className="font-mono text-[10px] text-neutral-600">#{product.id}</div>
      </td>
      <td className="px-4 py-3">{product.brand}</td>
      <td className="px-4 py-3 tabular-nums text-white">{formatKes(product.priceKes)}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            role="switch"
            aria-checked={inStock}
            aria-label={inStock ? "Mark out of stock" : "Mark in stock"}
            disabled={togglingStock}
            onClick={toggleStock}
            className={`relative h-4 w-7 shrink-0 rounded-full transition disabled:opacity-50 ${
              inStock
                ? product.stockStatus === "low_stock"
                  ? "bg-amber-500"
                  : "bg-[#00e599]"
                : "bg-neutral-700"
            }`}
          >
            <span
              className={`absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition ${
                inStock ? "left-[14px]" : "left-0.5"
              }`}
            />
          </button>
          <span
            className={`text-xs ${
              inStock
                ? product.stockStatus === "low_stock"
                  ? "text-amber-400"
                  : "text-emerald-400"
                : "text-red-400"
            }`}
          >
            {product.stockStatus === "low_stock"
              ? "Low stock"
              : inStock
                ? "In stock"
                : "Out of stock"}
          </span>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <Link
            to={`/products/${product.id}/edit`}
            className="rounded-lg border border-[#333] p-1.5 text-neutral-500 hover:text-white"
            title="Edit"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Link>
          <button
            type="button"
            disabled={deleting}
            onClick={async () => {
              setDeleting(true);
              try {
                await onDelete(product.id, product.name);
              } finally {
                setDeleting(false);
              }
            }}
            className="rounded-lg border border-[#333] p-1.5 text-neutral-500 hover:border-red-900/60 hover:text-red-400 disabled:opacity-40"
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}
