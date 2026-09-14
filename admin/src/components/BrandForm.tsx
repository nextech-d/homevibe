import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tag, Settings2 } from "lucide-react";
import { api } from "../lib/api";
import BrandLogoField from "./BrandLogoField";
import {
  StorefrontField,
  StorefrontSection,
  storefrontInputClass,
} from "./StorefrontPanel";

export type BrandTier = "signature" | "partner";

export type BrandDetail = {
  id: number;
  name: string;
  slug: string;
  tier: BrandTier;
  origin: string;
  logoUrl: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  sortOrder: number;
  isFeatured?: boolean;
  productCount?: number;
};

type Props = {
  brand?: BrandDetail;
  mode: "create" | "edit";
  onCreated?: (id: number) => void;
};

const UPLOADED_IMAGE_PREFIXES = ["/uploads/", "http://", "https://"];

function initialLogo(brand?: BrandDetail): string {
  const url = brand?.logoUrl ?? "";
  if (!url) return "";
  return UPLOADED_IMAGE_PREFIXES.some((prefix) => url.startsWith(prefix)) ? url : "";
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function BrandForm({ brand, mode, onCreated }: Props) {
  const navigate = useNavigate();
  const isNew = mode === "create";

  const [name, setName] = useState(brand?.name ?? "");
  const [metaTitle, setMetaTitle] = useState(brand?.metaTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(brand?.metaDescription ?? "");
  const [slug, setSlug] = useState(brand?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!brand);
  const [origin, setOrigin] = useState(brand?.origin ?? "");
  const [logoUrl, setLogoUrl] = useState(initialLogo(brand));
  const [sortOrder, setSortOrder] = useState(String(brand?.sortOrder ?? 0));
  const [isFeatured, setIsFeatured] = useState(brand?.isFeatured ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function handleNameChange(value: string) {
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const payload = {
      name: name.trim(),
      slug: slug.trim() || slugify(name),
      origin: origin.trim(),
      logoUrl: logoUrl || null,
      metaTitle: metaTitle || null,
      metaDescription: metaDescription || null,
      sortOrder: Number(sortOrder) || 0,
      isFeatured,
    };

    try {
      if (isNew) {
        const data = await api<{ brand: { id: number } }>("/admin/catalog/brands", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        if (onCreated) {
          onCreated(data.brand.id);
        } else {
          navigate(`/brands?created=${data.brand.id}`, { replace: true });
        }
      } else if (brand) {
        await api(`/admin/catalog/brands/${brand.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        navigate("/brands");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save brand");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
      <StorefrontSection
        title="Brand details"
        description="Name, origin, SEO fields, and logo for storefront brand pages."
        icon={Tag}
        accent="violet"
      >
        {error && (
          <p className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">
            {error}
          </p>
        )}
        <StorefrontField label="Brand name">
          <input
            required
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            className={storefrontInputClass}
          />
        </StorefrontField>
        <StorefrontField label="Meta title" hint="Defaults to brand name if empty.">
          <input
            value={metaTitle}
            onChange={(e) => setMetaTitle(e.target.value)}
            placeholder="SEO page title"
            className={storefrontInputClass}
          />
        </StorefrontField>
        <StorefrontField label="Meta description" hint={`${metaDescription.length} characters`}>
          <textarea
            rows={3}
            value={metaDescription}
            onChange={(e) => setMetaDescription(e.target.value)}
            placeholder="Short summary for search results"
            className={storefrontInputClass}
          />
        </StorefrontField>
        <StorefrontField label="Origin">
          <input
            required
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            placeholder="e.g. USA, Germany, Kenya"
            className={storefrontInputClass}
          />
        </StorefrontField>
        <BrandLogoField value={logoUrl} onChange={setLogoUrl} />
      </StorefrontSection>

      <StorefrontSection
        title="Settings"
        description="URL slug and listing order."
        icon={Settings2}
        accent="sky"
      >
        <StorefrontField label="Slug">
          <input
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
            placeholder={slugify(name) || "brand-slug"}
            className={`${storefrontInputClass} font-mono text-xs`}
          />
        </StorefrontField>
        <StorefrontField label="Sort order" hint="Lower numbers appear first.">
          <input
            type="number"
            min={0}
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className={storefrontInputClass}
          />
        </StorefrontField>
        <label className="flex items-center gap-2 rounded-lg border border-[#2a2a2a] bg-[#111111] px-3.5 py-3 text-xs text-neutral-400">
          <input
            type="checkbox"
            checked={isFeatured}
            onChange={(e) => setIsFeatured(e.target.checked)}
            className="rounded border-[#333]"
          />
          Featured on homepage
        </label>
        {!isNew && brand && brand.productCount !== undefined && (
          <p className="text-xs text-neutral-500">
            {brand.productCount} product{brand.productCount === 1 ? "" : "s"} linked
          </p>
        )}
        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-[#00e599] py-2.5 text-xs font-bold uppercase tracking-wider text-black hover:bg-[#00cc88] disabled:opacity-50"
        >
          {saving ? "Saving…" : isNew ? "Create brand" : "Update brand"}
        </button>
      </StorefrontSection>
    </form>
  );
}
