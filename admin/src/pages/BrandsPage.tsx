import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, RefreshCw, Plus, ExternalLink, Pencil, Trash2, Tag } from "lucide-react";
import { api, STORE_URL } from "../lib/api";
import { cardInner } from "../lib/cardSurfaces";
import {
  accentAt,
  CatalogEntityCard,
  CatalogStatTile,
  StorefrontSection,
  storefrontInputClass,
  storefrontSelectClass,
} from "../components/StorefrontPanel";
import type { BrandTier } from "../components/BrandForm";
import BrandCreatedView from "../views/BrandCreatedView";

type Brand = {
  id: number;
  name: string;
  slug: string;
  tier: BrandTier;
  origin: string;
  logoUrl: string | null;
  sortOrder: number;
  productCount: number;
};

type Summary = {
  total: number;
  filtered: number;
  signature: number;
  partner: number;
};

const QUICK_FILTERS = [
  { key: "all", label: "All", tier: "" },
  { key: "signature", label: "Signature", tier: "signature" },
  { key: "partner", label: "Partner", tier: "partner" },
] as const;

function BrandCardSkeleton() {
  return (
    <div className="flex h-full w-[80%] animate-pulse flex-col justify-self-start rounded-xl border border-[#333] bg-[#161616] p-3 sm:w-[80%] lg:w-full">
      <div className="flex items-start justify-between gap-2">
        <div className="h-3 w-24 rounded bg-[#333]" />
        <div className="h-6 w-6 rounded-md bg-[#333]" />
      </div>
      <div className="mt-auto flex items-center justify-between pt-2">
        <div className="h-3 w-12 rounded bg-[#333]" />
        <div className="h-3 w-16 rounded bg-[#333]" />
      </div>
    </div>
  );
}

function BrandCard({
  brand,
  onDelete,
  deleting,
  accentIndex,
}: {
  brand: Brand;
  onDelete: () => void;
  deleting: boolean;
  accentIndex: number;
}) {
  return (
    <CatalogEntityCard
      accent={accentAt(accentIndex)}
      className="flex h-full w-[80%] flex-col justify-self-start p-3 sm:w-[80%] lg:w-full"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <Link
            to={`/brands/${brand.id}/edit`}
            className="block truncate text-xs font-semibold text-white hover:text-[#00e599]"
          >
            {brand.name}
          </Link>
        </div>
        <div className="shrink-0 rounded-md bg-[#00e599]/10 p-1.5 text-[#00e599]">
          <Tag className="h-3.5 w-3.5" />
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 pt-2">
        <div className="flex items-center gap-2">
          <a
            href={`${STORE_URL}/brand/${brand.slug}`}
            target="_blank"
            rel="noreferrer"
            className="text-neutral-500 hover:text-white"
            title="View on storefront"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <Link
            to={`/brands/${brand.id}/edit`}
            className="text-neutral-500 hover:text-white"
            title="Edit brand"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Link>
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className="text-red-400/70 hover:text-red-400 disabled:opacity-50"
            title="Delete brand"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
        {brand.productCount > 0 ? (
          <Link
            to={`/products?brandId=${brand.id}`}
            className="text-[10px] font-medium tabular-nums text-neutral-500 hover:text-[#00e599]"
          >
            {brand.productCount} {brand.productCount === 1 ? "product" : "products"}
          </Link>
        ) : (
          <span className="text-[10px] tabular-nums text-neutral-600">0 products</span>
        )}
      </div>
    </CatalogEntityCard>
  );
}

export default function BrandsPage() {
  const [searchParams] = useSearchParams();
  const createdId = searchParams.get("created");
  if (createdId) {
    return <BrandCreatedView entityId={createdId} />;
  }
  return <BrandsListPage />;
}

const tabClass = (active: boolean) =>
  `rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider ${
    active
      ? "bg-[#00e599]/15 text-[#00e599]"
      : "bg-[#111] text-neutral-500 hover:text-neutral-300"
  }`;

function BrandsListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [searchInput, setSearchInput] = useState(searchParams.get("q") ?? "");

  const tierFilter = searchParams.get("tier") ?? "";

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    const q = searchParams.get("q");
    if (q) params.set("q", q);
    if (tierFilter) params.set("tier", tierFilter);
    const s = params.toString();
    return s ? `?${s}` : "";
  }, [searchParams, tierFilter]);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      setError("");
      try {
        const data = await api<{ brands: Brand[]; summary: Summary }>(
          `/admin/catalog/brands${queryString}`
        );
        setBrands(data.brands);
        setSummary(data.summary);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load brands");
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
    if (q) next.set("q", q);
    if (filter.tier) next.set("tier", filter.tier);
    setSearchParams(next);
  }

  function activeQuickKey(): string {
    if (tierFilter === "signature") return "signature";
    if (tierFilter === "partner") return "partner";
    if (!tierFilter) return "all";
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

  async function handleDelete(brand: Brand) {
    if (
      !confirm(
        brand.productCount > 0
          ? `"${brand.name}" has ${brand.productCount} product(s). Reassign them, or set them to No brand, before deleting.`
          : `Delete "${brand.name}"? This cannot be undone.`
      )
    ) {
      return;
    }
    if (brand.productCount > 0) return;

    setDeletingId(brand.id);
    setError("");
    try {
      await api(`/admin/catalog/brands/${brand.id}`, { method: "DELETE" });
      await load(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Cannot delete brand");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-white">Brands</h1>
          <p className="mt-1 text-sm text-neutral-500">Manage product brands and tiers</p>
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
            to="/brands/new"
            className="inline-flex items-center gap-2 rounded-lg bg-[#00e599] px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-black hover:bg-[#00cc88]"
          >
            <Plus className="h-3.5 w-3.5" />
            Add brand
          </Link>
        </div>
      </div>

      <StorefrontSection
        className="mt-6"
        title="Overview"
        description="Brand tiers in your catalog"
        icon={Tag}
        accent="green"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {loading && !summary ? (
            <>
              <div className="h-24 animate-pulse rounded-xl border border-[#333] bg-[#161616]" />
              <div className="h-24 animate-pulse rounded-xl border border-[#333] bg-[#161616] sm:col-start-2 lg:col-start-3" />
              <div className="h-24 animate-pulse rounded-xl border border-[#333] bg-[#161616] sm:col-span-2 sm:col-start-1 lg:col-span-1 lg:col-start-5" />
            </>
          ) : (
            <>
              <CatalogStatTile
                label="Total brands"
                value={summary?.total ?? 0}
                icon={Tag}
                accent="green"
              />
              <div className="sm:col-start-2 lg:col-start-3">
                <CatalogStatTile
                  label="Signature"
                  value={summary?.signature ?? 0}
                  icon={Tag}
                  accent="sky"
                  valueClassName="text-[#00e599]"
                />
              </div>
              <div className="sm:col-span-2 sm:col-start-1 lg:col-span-1 lg:col-start-5">
                <CatalogStatTile
                  label="Partner"
                  value={summary?.partner ?? 0}
                  icon={Tag}
                  accent="violet"
                />
              </div>
            </>
          )}
        </div>
      </StorefrontSection>

      <StorefrontSection
        className="mt-6"
        title="Filters"
        description="Quick tier filters, search, and tier dropdown."
        icon={Search}
        accent="violet"
      >
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {QUICK_FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => applyQuickFilter(f.key)}
                className={tabClass(activeQuickKey() === f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>
          <form onSubmit={handleSearch} className="relative min-w-[200px] flex-1 max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-600" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search name, slug, origin…"
              className={`${storefrontInputClass} pl-10`}
            />
          </form>
          <select
            value={tierFilter}
            onChange={(e) => {
              const next = new URLSearchParams(searchParams);
              if (e.target.value) next.set("tier", e.target.value);
              else next.delete("tier");
              setSearchParams(next);
            }}
            className={`${storefrontSelectClass} w-full min-w-[160px] max-w-xs sm:w-44`}
          >
            <option value="">All tiers</option>
            <option value="signature">Signature</option>
            <option value="partner">Partner</option>
          </select>
        </div>
      </StorefrontSection>

      {error && (
        <p className="mt-4 rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">
          {error}
        </p>
      )}

      <StorefrontSection
        className="mt-6"
        title="All brands"
        description={
          summary ? `${summary.filtered} of ${summary.total} shown` : "Browse and manage your brands"
        }
        icon={Tag}
        accent="amber"
        badge={summary ? String(summary.filtered) : undefined}
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <BrandCardSkeleton key={i} />)
          ) : brands.length === 0 ? (
            <div className={`col-span-full rounded-xl px-6 py-16 text-center text-sm text-neutral-500 ${cardInner}`}>
              No brands match your filters.
            </div>
          ) : (
            brands.map((brand, index) => (
              <BrandCard
                key={brand.id}
                brand={brand}
                accentIndex={index}
                deleting={deletingId === brand.id}
                onDelete={() => handleDelete(brand)}
              />
            ))
          )}
        </div>
      </StorefrontSection>
    </div>
  );
}
