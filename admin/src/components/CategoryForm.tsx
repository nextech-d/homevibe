import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layers, Settings2, FolderTree, Plus, Trash2 } from "lucide-react";
import { api } from "../lib/api";
import {
  StorefrontField,
  StorefrontSection,
  storefrontInputClass,
} from "./StorefrontPanel";

export type CategorySubcategory = {
  id: number;
  label: string;
  slug: string;
  categoryId: number;
  metaTitle?: string | null;
  metaDescription?: string | null;
  sortOrder: number;
  productCount: number;
};

export type CategoryDetail = {
  id: number;
  label: string;
  slug: string;
  navLabel: string;
  description: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
  sortOrder: number;
  subcategoryCount?: number;
  productCount?: number;
  subcategories?: CategorySubcategory[];
};

type Props = {
  category?: CategoryDetail;
  mode: "create" | "edit";
  onCreated?: (id: number) => void;
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

type SubcategoryDraft = {
  key: string;
  label: string;
  slug: string;
  slugTouched: boolean;
  sortOrder: string;
};

function newSubcategoryDraft(sortOrder = 0): SubcategoryDraft {
  return {
    key: crypto.randomUUID(),
    label: "",
    slug: "",
    slugTouched: false,
    sortOrder: String(sortOrder),
  };
}

export default function CategoryForm({ category, mode, onCreated }: Props) {
  const navigate = useNavigate();
  const isNew = mode === "create";

  const [label, setLabel] = useState(category?.label ?? "");
  const [navLabel, setNavLabel] = useState(category?.navLabel ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [metaTitle, setMetaTitle] = useState(category?.metaTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(category?.metaDescription ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!category);
  const [sortOrder, setSortOrder] = useState(String(category?.sortOrder ?? 0));
  const [subcategoryDrafts, setSubcategoryDrafts] = useState<SubcategoryDraft[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function handleLabelChange(value: string) {
    setLabel(value);
    if (!slugTouched) setSlug(slugify(value));
    if (!navLabel || navLabel === label) setNavLabel(value);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const payload = {
      label: label.trim(),
      navLabel: (navLabel || label).trim(),
      description: (description || label).trim(),
      metaTitle: metaTitle.trim(),
      metaDescription: metaDescription.trim(),
      slug: slug.trim() || slugify(label),
      sortOrder: Number(sortOrder) || 0,
    };

    try {
      if (isNew) {
        const data = await api<{ category: { id: number } }>("/admin/catalog/categories", {
          method: "POST",
          body: JSON.stringify(payload),
        });

        const subsToCreate = subcategoryDrafts.filter((sub) => sub.label.trim());
        for (let i = 0; i < subsToCreate.length; i++) {
          const sub = subsToCreate[i];
          await api("/admin/catalog/subcategories", {
            method: "POST",
            body: JSON.stringify({
              categoryId: data.category.id,
              label: sub.label.trim(),
              slug: sub.slug.trim() || slugify(sub.label),
              sortOrder: Number(sub.sortOrder) || i,
            }),
          });
        }

        if (onCreated) {
          onCreated(data.category.id);
        } else {
          navigate(`/categories?created=${data.category.id}`, { replace: true });
        }
      } else if (category) {
        await api(`/admin/catalog/categories/${category.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        navigate("/categories");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save category");
    } finally {
      setSaving(false);
    }
  }

  function updateSubcategoryDraft(key: string, patch: Partial<SubcategoryDraft>) {
    setSubcategoryDrafts((prev) =>
      prev.map((sub) => (sub.key === key ? { ...sub, ...patch } : sub))
    );
  }

  function handleSubcategoryLabelChange(key: string, value: string) {
    setSubcategoryDrafts((prev) =>
      prev.map((sub) => {
        if (sub.key !== key) return sub;
        return {
          ...sub,
          label: value,
          slug: sub.slugTouched ? sub.slug : slugify(value),
        };
      })
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
      <StorefrontSection
        title="Category details"
        description={
          isNew
            ? "Name, navigation text, and description shown on the storefront."
            : "Label, navigation text, and description shown on the storefront."
        }
        icon={Layers}
        accent="green"
      >
        {error && (
          <p className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">
            {error}
          </p>
        )}
        <StorefrontField label={isNew ? "Name" : "Label"} sentenceCase={isNew}>
          <input
            required
            value={label}
            onChange={(e) => handleLabelChange(e.target.value)}
            className={storefrontInputClass}
          />
        </StorefrontField>
        <StorefrontField
          label="Nav label"
          sentenceCase={isNew}
          hint="Short label used in the header menu."
        >
          <input
            required
            value={navLabel}
            onChange={(e) => setNavLabel(e.target.value)}
            className={storefrontInputClass}
          />
        </StorefrontField>
        <StorefrontField label="Description">
          <textarea
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={storefrontInputClass}
          />
        </StorefrontField>
        <StorefrontField
          label="Meta title"
          hint="Leave empty to use the generated title."
        >
          <input
            value={metaTitle}
            onChange={(e) => setMetaTitle(e.target.value)}
            placeholder="SEO page title"
            className={storefrontInputClass}
          />
        </StorefrontField>
        <StorefrontField
          label="Meta description"
          hint={
            metaDescription
              ? `${metaDescription.length} characters — aim for 120-155.`
              : "Leave empty to use the generated description."
          }
        >
          <textarea
            rows={3}
            value={metaDescription}
            onChange={(e) => setMetaDescription(e.target.value)}
            placeholder="Short summary for search results"
            className={storefrontInputClass}
          />
        </StorefrontField>
      </StorefrontSection>

      <StorefrontSection
        title="Settings"
        description="URL slug and sort order for catalog listings."
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
            placeholder={slugify(label) || "category-slug"}
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
        {!isNew && category && category.subcategoryCount !== undefined && (
          <p className="text-xs text-neutral-500">
            {category.subcategoryCount} subcategor
            {category.subcategoryCount === 1 ? "y" : "ies"}
          </p>
        )}
        {!isNew && (
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-[#00e599] py-2.5 text-xs font-bold uppercase tracking-wider text-black hover:bg-[#00cc88] disabled:opacity-50"
          >
            {saving ? "Saving…" : "Update category"}
          </button>
        )}
      </StorefrontSection>
      </div>

    {isNew && (
      <StorefrontSection
        className="mt-6"
        title="Subcategories"
        description="Optional. Add subcategories now or skip and create the category on its own."
        icon={FolderTree}
        accent="violet"
        actions={
          <button
            type="button"
            onClick={() =>
              setSubcategoryDrafts((prev) => [...prev, newSubcategoryDraft(prev.length)])
            }
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#333] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-400 hover:text-white"
          >
            <Plus className="h-3.5 w-3.5" />
            Add subcategory
          </button>
        }
      >
        {subcategoryDrafts.length === 0 ? (
          <p className="text-sm text-neutral-500">No subcategories added yet.</p>
        ) : (
          <div className="space-y-3">
            {subcategoryDrafts.map((sub, index) => (
              <div
                key={sub.key}
                className="rounded-lg border border-[#2a2a2a] bg-[#111111] p-3.5"
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
                    Subcategory {index + 1}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      setSubcategoryDrafts((prev) => prev.filter((row) => row.key !== sub.key))
                    }
                    className="text-red-400/70 hover:text-red-400"
                    title="Remove"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <StorefrontField label="Label">
                    <input
                      value={sub.label}
                      onChange={(e) => handleSubcategoryLabelChange(sub.key, e.target.value)}
                      placeholder="e.g. Refrigerators"
                      className={storefrontInputClass}
                    />
                  </StorefrontField>
                  <StorefrontField label="Slug">
                    <input
                      value={sub.slug}
                      onChange={(e) =>
                        updateSubcategoryDraft(sub.key, {
                          slugTouched: true,
                          slug: e.target.value,
                        })
                      }
                      placeholder={slugify(sub.label) || "subcategory-slug"}
                      className={`${storefrontInputClass} font-mono text-xs`}
                    />
                  </StorefrontField>
                  <StorefrontField label="Sort order">
                    <input
                      type="number"
                      min={0}
                      value={sub.sortOrder}
                      onChange={(e) =>
                        updateSubcategoryDraft(sub.key, { sortOrder: e.target.value })
                      }
                      className={storefrontInputClass}
                    />
                  </StorefrontField>
                </div>
              </div>
            ))}
          </div>
        )}
      </StorefrontSection>
    )}

      {isNew && (
        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-[#00e599] py-2.5 text-xs font-bold uppercase tracking-wider text-black hover:bg-[#00cc88] disabled:opacity-50 sm:w-auto sm:min-w-[200px]"
        >
          {saving ? "Saving…" : "Create category"}
        </button>
      )}
    </form>
  );
}
