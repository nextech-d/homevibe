import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";

export type SubcategoryDetail = {
  id: number;
  categoryId: number;
  categoryLabel: string;
  label: string;
  slug: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
  sortOrder: number;
  productCount?: number;
};

type CategoryOption = { id: number; label: string };

type Props = {
  subcategory?: SubcategoryDetail;
  mode: "create" | "edit";
  onCreated?: (id: number) => void;
  defaultCategoryId?: number;
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function SubcategoryForm({
  subcategory,
  mode,
  onCreated,
  defaultCategoryId,
}: Props) {
  const navigate = useNavigate();
  const isNew = mode === "create";

  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [label, setLabel] = useState(subcategory?.label ?? "");
  const [categoryId, setCategoryId] = useState(
    subcategory?.categoryId ?? defaultCategoryId ?? 0
  );
  const [metaTitle, setMetaTitle] = useState(subcategory?.metaTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(subcategory?.metaDescription ?? "");
  const [slug, setSlug] = useState(subcategory?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!subcategory);
  const [sortOrder, setSortOrder] = useState(String(subcategory?.sortOrder ?? 0));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const inputClass =
    "w-full rounded-lg border border-[#333] bg-[#0a0a0a] px-3 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:border-[#00e599]/40 focus:outline-none";
  const labelClass =
    "mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-neutral-500";

  useEffect(() => {
    api<{ categories: { id: number; label: string }[] }>("/admin/catalog/categories").then(
      (data) => {
        const opts = data.categories.map((c) => ({ id: c.id, label: c.label }));
        setCategories(opts);
        if (isNew && opts.length && !subcategory) {
          const preferred = defaultCategoryId && opts.some((o) => o.id === defaultCategoryId)
            ? defaultCategoryId
            : opts[0].id;
          setCategoryId(preferred);
        }
      }
    );
  }, [isNew, subcategory, defaultCategoryId]);

  function handleLabelChange(value: string) {
    setLabel(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const payload = {
      label: label.trim(),
      categoryId: Number(categoryId),
      metaTitle: metaTitle.trim(),
      metaDescription: metaDescription.trim(),
      slug: slug.trim() || slugify(label),
      sortOrder: Number(sortOrder) || 0,
    };

    try {
      if (isNew) {
        const data = await api<{ subcategory: { id: number } }>("/admin/catalog/subcategories", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        if (onCreated) {
          onCreated(data.subcategory.id);
        } else {
          navigate(`/categories?createdSub=${data.subcategory.id}`, { replace: true });
        }
      } else if (subcategory) {
        await api(`/admin/catalog/subcategories/${subcategory.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        navigate("/categories");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save subcategory");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 grid gap-6 lg:grid-cols-[1fr_280px]">
      <div className="space-y-5 rounded-xl border border-[#262626] bg-[#111111] p-6">
        {error && (
          <p className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">
            {error}
          </p>
        )}

        <div>
          <label className={labelClass}>Parent category</label>
          <select
            required
            value={categoryId}
            onChange={(e) => setCategoryId(Number(e.target.value))}
            className={inputClass}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
          {!isNew && subcategory && (
            <p className="mt-1.5 text-xs text-neutral-600">
              Currently under{" "}
              <Link
                to={`/categories/${subcategory.categoryId}/edit`}
                className="text-[#00e599] hover:underline"
              >
                {subcategory.categoryLabel}
              </Link>
            </p>
          )}
        </div>

        <div>
          <label className={labelClass}>Label</label>
          <input
            required
            value={label}
            onChange={(e) => handleLabelChange(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Meta title</label>
          <input
            value={metaTitle}
            onChange={(e) => setMetaTitle(e.target.value)}
            placeholder="SEO page title"
            className={inputClass}
          />
          <p className="mt-1.5 text-xs text-neutral-600">
            Leave empty to use the generated title.
          </p>
        </div>

        <div>
          <label className={labelClass}>Meta description</label>
          <textarea
            rows={3}
            value={metaDescription}
            onChange={(e) => setMetaDescription(e.target.value)}
            placeholder="Short summary for search results"
            className={inputClass}
          />
          <p className="mt-1.5 text-xs text-neutral-600">
            {metaDescription
              ? `${metaDescription.length} characters \u2014 aim for 120-155.`
              : "Leave empty to use the generated description."}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-[#262626] bg-[#111111] p-5">
        <label className={labelClass}>Slug</label>
        <input
          value={slug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(e.target.value);
          }}
          placeholder={slugify(label) || "subcategory-slug"}
          className="w-full rounded-lg border border-[#333] bg-[#0a0a0a] px-3 py-2 font-mono text-xs text-white focus:border-[#00e599]/40 focus:outline-none"
        />

        <label className={`${labelClass} mt-4`}>Sort order</label>
        <input
          type="number"
          min={0}
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          className="w-full rounded-lg border border-[#333] bg-[#0a0a0a] px-3 py-2 text-sm text-white focus:border-[#00e599]/40 focus:outline-none"
        />

        {mode === "edit" && subcategory?.productCount !== undefined && (
          <p className="mt-4 text-xs text-neutral-500">
            {subcategory.productCount} product{subcategory.productCount === 1 ? "" : "s"} linked
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="mt-5 w-full rounded-lg bg-[#00e599] py-2.5 text-xs font-bold uppercase tracking-wider text-black hover:bg-[#00cc88] disabled:opacity-50"
        >
          {saving ? "Saving…" : isNew ? "Create subcategory" : "Update subcategory"}
        </button>
      </div>
    </form>
  );
}
