import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Settings2, FileText, MessagesSquare, ChevronUp, ChevronDown } from "lucide-react";
import { api } from "../lib/api";
import { ProductGalleryField, ProductImageField } from "./ProductImageField";
import DescriptionEditor from "./DescriptionEditor";
import { descriptionHasText } from "../lib/descriptionHtml";
import { parseFaqBlock } from "../lib/parseFaqBlock";
import { htmlToMarkdown } from "../lib/htmlToMarkdown";
import {
  StorefrontField,
  StorefrontSection,
  storefrontInputClass,
  storefrontSelectClass,
} from "./StorefrontPanel";
import type {
  AdminProductDetail,
  BrandOption,
  StockStatus,
  SubcategoryOption,
} from "../lib/products";

function subcategoryOptionLabel(option: SubcategoryOption): string {
  if (option.label.toLowerCase() === option.categoryLabel.toLowerCase()) {
    return option.categoryLabel;
  }
  return `${option.categoryLabel} — ${option.label}`;
}

const STOCK_OPTIONS: { value: StockStatus; label: string }[] = [
  { value: "in_stock", label: "In stock" },
  { value: "low_stock", label: "Low stock" },
  { value: "out_of_stock", label: "Out of stock" },
];

type ProductFormProps = {
  brands: BrandOption[];
  subcategories: SubcategoryOption[];
  product?: AdminProductDetail;
  mode: "create" | "edit";
  onCreated?: (id: number) => void;
};

const UPLOADED_IMAGE_PREFIXES = ["/uploads/", "http://", "https://"];

function initialMainImage(product?: AdminProductDetail): string {
  const id = product?.primaryPhotoId ?? "";
  if (!id) return "";
  return UPLOADED_IMAGE_PREFIXES.some((prefix) => id.startsWith(prefix)) ? id : "";
}

function initialSecondaryImages(product?: AdminProductDetail): string[] {
  if (!product?.galleryPhotoIds.length) return [];
  return product.galleryPhotoIds.filter((id) =>
    UPLOADED_IMAGE_PREFIXES.some((prefix) => id.startsWith(prefix))
  );
}

export default function ProductForm({
  brands,
  subcategories,
  product,
  mode,
  onCreated,
}: ProductFormProps) {
  const navigate = useNavigate();
  const isEdit = mode === "edit";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState(product?.name ?? "");
  const [longForm, setLongForm] = useState(product?.body ?? "");
  const [highlights, setHighlights] = useState((product?.highlights ?? []).join("\n"));
  const [claimsChecked, setClaimsChecked] = useState(Boolean(product?.claimsCheckedAt));
  const [faqs, setFaqs] = useState<{ question: string; answer: string; sortOrder: number }[]>(
    (product?.faqs ?? []).map((faq, index) => ({ ...faq, sortOrder: index }))
  );
  // Open on a product with no questions yet: the paste box is how a set of
  // questions gets entered, so hiding it behind a click only helps once there
  // is something in the list to protect.
  const [bulkOpen, setBulkOpen] = useState((product?.faqs ?? []).length === 0);
  const [bulkText, setBulkText] = useState("");
  const parsedBulk = bulkText.trim() ? parseFaqBlock(bulkText) : [];
  const usableBulk = parsedBulk.filter((row) => !row.warning);

  /**
   * Moves a question and renumbers the set. The list is what the page shows,
   * in the order it shows it, so the row order is the sort order - a number
   * box asked someone to keep two things in their head at once.
   */
  function moveFaq(index: number, direction: -1 | 1) {
    setFaqs((rows) => {
      const target = index + direction;
      if (target < 0 || target >= rows.length) return rows;
      const next = [...rows];
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((row, i) => ({ ...row, sortOrder: i }));
    });
  }

  /**
   * Pasted formatted text arrives with an HTML flavour alongside the plain one.
   * Converting it keeps the field markdown while sparing whoever is pasting a
   * document from retyping every # and **.
   */
  function handleLongFormPaste(event: React.ClipboardEvent<HTMLTextAreaElement>) {
    const html = event.clipboardData.getData("text/html");
    if (!html) return; // plain text pastes as it always did

    const markdown = htmlToMarkdown(html);
    if (!markdown) return;

    event.preventDefault();
    const field = event.currentTarget;
    const { selectionStart, selectionEnd, value } = field;
    const next = value.slice(0, selectionStart) + markdown + value.slice(selectionEnd);
    setLongForm(next);
    requestAnimationFrame(() => {
      const caret = selectionStart + markdown.length;
      field.setSelectionRange(caret, caret);
    });
  }
  const [metaTitle, setMetaTitle] = useState(product?.metaTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(product?.metaDescription ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [brandId, setBrandId] = useState(product?.brandId ?? brands[0]?.id ?? 0);
  const [subcategoryId, setSubcategoryId] = useState(
    product?.subcategoryId ?? subcategories[0]?.id ?? 0
  );
  const [priceKes, setPriceKes] = useState(String(product?.priceKes ?? ""));
  const [stockStatus, setStockStatus] = useState<StockStatus>(
    product?.stockStatus ?? "in_stock"
  );
  const [isPublished, setIsPublished] = useState(product?.isPublished ?? false);
  const [isFeatured, setIsFeatured] = useState(product?.isFeatured ?? false);
  const [specs, setSpecs] = useState(product?.specs ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [mainImage, setMainImage] = useState(initialMainImage(product));
  const [secondaryImages, setSecondaryImages] = useState(initialSecondaryImages(product));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (isPublished && !mainImage) {
      setError("Main image is required to publish. Save as draft or upload an image.");
      return;
    }

    if (!descriptionHasText(description)) {
      setError("Description is required.");
      return;
    }

    setLoading(true);

    const body = {
      id: product?.id,
      name,
      body: longForm.trim() || null,
      faqs,
      metaTitle: metaTitle || null,
      metaDescription: metaDescription || null,
      highlights: highlights
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
      claimsChecked,
      slug: slug || undefined,
      brandId: Number(brandId),
      subcategoryId: Number(subcategoryId),
      priceKes: Number(priceKes),
      stockStatus,
      isPublished,
      isFeatured,
      specs,
      description,
      primaryPhotoId: mainImage,
      galleryPhotoIds: secondaryImages,
    };

    try {
      if (isEdit) {
        await api("/admin/products", { method: "PATCH", body: JSON.stringify(body) });
        navigate("/products");
      } else {
        const data = await api<{ product: { id: number } }>("/admin/products", {
          method: "POST",
          body: JSON.stringify(body),
        });
        if (onCreated) {
          onCreated(data.product.id);
        } else {
          navigate(`/products?created=${data.product.id}`, { replace: true });
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-6">
      {error && (
        <p className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">
          {error}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        {/* Left column. The grid has two tracks - content here, catalog
            settings in the 320px rail - so a new section has to go inside
            one of them rather than alongside as a third child. */}
        <div className="space-y-6">
          <StorefrontSection
            title="Product content"
            description="Name, SEO, description, and images for the storefront product page."
            icon={FileText}
            accent="green"
          >
            <StorefrontField label="Name">
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={storefrontInputClass}
              />
            </StorefrontField>
            <StorefrontField label="Meta title">
              <input
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                placeholder="SEO page title (defaults to product name)"
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
            <DescriptionEditor value={description} onChange={setDescription} />
            <StorefrontField
              label="Long-form content"
              hint="Markdown, shown below the description on the product page. ## for headings, - for bullets, | for tables. Paste from a document and the formatting is converted for you."
            >
              <textarea
                rows={12}
                value={longForm}
                onChange={(e) => setLongForm(e.target.value)}
                onPaste={handleLongFormPaste}
                placeholder={"## What fits this\n\n- Runs on standard 13A\n- Needs 5cm clearance at the back"}
                className={`${storefrontInputClass} font-mono text-xs`}
              />
            </StorefrontField>
            <StorefrontField
              label="Highlights"
              hint="One per line. Shown as a checked list under the questions on the product page."
            >
              <textarea
                rows={4}
                value={highlights}
                onChange={(e) => setHighlights(e.target.value)}
                placeholder={"Fits a 600mm gap\nRuns on standard 13A\nInverter compressor"}
                className={storefrontInputClass}
              />
            </StorefrontField>
            <ProductImageField
              label="Main image"
              required={isPublished}
              value={mainImage}
              onChange={setMainImage}
              hint={
                isPublished ? undefined : "Optional for drafts — required before publishing."
              }
            />
            <ProductGalleryField
              label="Secondary images"
              value={secondaryImages}
              onChange={setSecondaryImages}
            />
          </StorefrontSection>

          <StorefrontSection
            title="Questions & answers"
            description="Shown on the product page and described to Google as an FAQ for that page. Blank rows are ignored."
            icon={MessagesSquare}
            accent="green"
          >
            <div className="space-y-3">
              {faqs.length === 0 && (
                <p className="text-xs text-neutral-500">
                  No questions yet. Add the ones buyers actually ask about this product.
                </p>
              )}
              {faqs.map((faq, index) => (
                <div key={index} className="rounded-lg border border-[#262626] bg-[#0d0d0d] p-3">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 space-y-2">
                      <input
                        value={faq.question}
                        onChange={(e) =>
                          setFaqs((rows) =>
                            rows.map((row, i) =>
                              i === index ? { ...row, question: e.target.value } : row
                            )
                          )
                        }
                        placeholder="Does it need a stabiliser?"
                        className={storefrontInputClass}
                      />
                      <textarea
                        rows={3}
                        value={faq.answer}
                        onChange={(e) =>
                          setFaqs((rows) =>
                            rows.map((row, i) =>
                              i === index ? { ...row, answer: e.target.value } : row
                            )
                          )
                        }
                        placeholder="Answer shown when the question is opened."
                        className={storefrontInputClass}
                      />
                    </div>
                    <div className="flex w-24 shrink-0 flex-col gap-2">
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => moveFaq(index, -1)}
                          disabled={index === 0}
                          aria-label="Move question up"
                          title="Move up"
                          className="flex-1 rounded-lg border border-[#333] px-2 py-1 text-neutral-400 hover:bg-[#1a1a1a] disabled:opacity-30"
                        >
                          <ChevronUp size={14} className="mx-auto" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveFaq(index, 1)}
                          disabled={index === faqs.length - 1}
                          aria-label="Move question down"
                          title="Move down"
                          className="flex-1 rounded-lg border border-[#333] px-2 py-1 text-neutral-400 hover:bg-[#1a1a1a] disabled:opacity-30"
                        >
                          <ChevronDown size={14} className="mx-auto" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setFaqs((rows) =>
                            rows
                              .filter((_, i) => i !== index)
                              .map((row, i) => ({ ...row, sortOrder: i }))
                          )
                        }
                        className="rounded-lg border border-[#333] px-2 py-1 text-xs text-neutral-400 hover:bg-[#1a1a1a]"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setFaqs((rows) => [
                      ...rows,
                      { question: "", answer: "", sortOrder: rows.length },
                    ])
                  }
                  className="rounded-lg border border-[#333] bg-[#111] px-3 py-2 text-xs font-medium text-neutral-300 hover:bg-[#1a1a1a]"
                >
                  Add question
                </button>
                <button
                  type="button"
                  onClick={() => setBulkOpen((open) => !open)}
                  className="rounded-lg border border-[#333] bg-[#111] px-3 py-2 text-xs font-medium text-neutral-300 hover:bg-[#1a1a1a]"
                >
                  {bulkOpen ? "Close paste box" : "Paste several"}
                </button>
              </div>

              {bulkOpen && (
                <div className="space-y-3 rounded-lg border border-[#262626] bg-[#0d0d0d] p-3">
                  <textarea
                    rows={10}
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                    placeholder={"Does it need a stabiliser?\nNot required, but a fridge guard is sensible.\n\nIs installation included?\nYes, countrywide."}
                    className={`${storefrontInputClass} font-mono text-xs`}
                  />
                  <p className="text-[11px] text-neutral-500">
                    One pair per block: first line is the question, the rest is the answer,
                    blank line starts the next. Q:/A: prefixes, bullets, numbering and
                    **bold** are stripped.
                  </p>

                  {/* Preview before anything is added, so a bad paste is visible
                      rather than saved silently. */}
                  {parsedBulk.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[11px] font-semibold text-neutral-400">
                        Parsed {usableBulk.length} question{usableBulk.length === 1 ? "" : "s"}
                        {parsedBulk.length !== usableBulk.length &&
                          ` · ${parsedBulk.length - usableBulk.length} needs attention`}
                      </p>
                      <ol className="space-y-2">
                        {parsedBulk.map((row, index) => (
                          <li
                            key={index}
                            className={`rounded border px-3 py-2 text-xs ${
                              row.warning
                                ? "border-amber-900/60 bg-amber-950/20"
                                : "border-[#262626] bg-[#111]"
                            }`}
                          >
                            <p className="font-semibold text-neutral-200">{row.question}</p>
                            {row.warning ? (
                              <p className="mt-1 text-[11px] text-amber-500">{row.warning}</p>
                            ) : (
                              <p className="mt-1 text-neutral-400">{row.answer}</p>
                            )}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={usableBulk.length === 0}
                    onClick={() => {
                      setFaqs((rows) => [
                        ...rows,
                        ...usableBulk.map((row, index) => ({
                          question: row.question,
                          answer: row.answer,
                          sortOrder: rows.length + index,
                        })),
                      ]);
                      setBulkText("");
                      setBulkOpen(false);
                    }}
                    className="rounded-lg bg-[#00e599] px-3 py-2 text-xs font-semibold text-black disabled:opacity-40"
                  >
                    Add {usableBulk.length || ""} to the list
                  </button>
                </div>
              )}
            </div>
          </StorefrontSection>
        </div>

        <StorefrontSection
          title="Catalog settings"
          description="Pricing, stock, visibility, and categorization."
          icon={Settings2}
          accent="sky"
          className="lg:sticky lg:top-8"
        >
          <StorefrontField label="Slug" hint="Auto-generated from name if empty.">
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="auto-generated from name"
              className={`${storefrontInputClass} font-mono text-xs`}
            />
          </StorefrontField>
          <StorefrontField label="Brand">
            <select
              required
              value={brandId}
              onChange={(e) => setBrandId(Number(e.target.value))}
              className={storefrontSelectClass}
            >
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </StorefrontField>
          <StorefrontField label="Category">
            <select
              required
              value={subcategoryId}
              onChange={(e) => setSubcategoryId(Number(e.target.value))}
              className={storefrontSelectClass}
            >
              {subcategories.map((option) => (
                <option key={option.id} value={option.id}>
                  {subcategoryOptionLabel(option)}
                </option>
              ))}
            </select>
          </StorefrontField>
          <StorefrontField label="Price (KES)">
            <input
              required
              type="number"
              min={0}
              value={priceKes}
              onChange={(e) => setPriceKes(e.target.value)}
              className={storefrontInputClass}
            />
          </StorefrontField>
          <StorefrontField label="Stock status">
            <select
              value={stockStatus}
              onChange={(e) => setStockStatus(e.target.value as StockStatus)}
              className={storefrontSelectClass}
            >
              {STOCK_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </StorefrontField>
          <StorefrontField label="Specs">
            <input
              value={specs}
              onChange={(e) => setSpecs(e.target.value)}
              placeholder="Convection • AI Assist • Matte Black"
              className={storefrontInputClass}
            />
          </StorefrontField>
          <label className="flex items-center gap-2 rounded-lg border border-[#2a2a2a] bg-[#111111] px-3.5 py-3 text-xs text-neutral-400">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="rounded border-[#333]"
            />
            Published on storefront
          </label>
          <label className="flex items-center gap-2 rounded-lg border border-[#2a2a2a] bg-[#111111] px-3.5 py-3 text-xs text-neutral-400">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="rounded border-[#333]"
            />
            Featured on homepage
          </label>
          {/* The escape hatch for the publish guard. Copy that promises
              specific contents - a box list, a free accessory, a price - is
              refused on publish until someone says they have checked it. */}
          <label className="flex items-start gap-2 rounded-lg border border-[#2a2a2a] bg-[#111111] px-3.5 py-3 text-xs text-neutral-400">
            <input
              type="checkbox"
              checked={claimsChecked}
              onChange={(e) => setClaimsChecked(e.target.checked)}
              className="mt-0.5 rounded border-[#333]"
            />
            <span>
              Promises checked
              <span className="mt-1 block text-[11px] leading-snug text-neutral-500">
                Tick only if you have opened a carton or read the manufacturer's spec
                sheet for the contents and accessories this copy promises.
                {product?.claimsCheckedAt && (
                  <span className="mt-1 block text-neutral-600">
                    Checked {new Date(product.claimsCheckedAt).toLocaleDateString()}
                  </span>
                )}
              </span>
            </span>
          </label>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#00e599] py-2.5 text-xs font-bold uppercase tracking-wider text-black hover:bg-[#00cc88] disabled:opacity-50"
          >
            {loading ? "Saving…" : isEdit ? "Update product" : "Create product"}
          </button>
        </StorefrontSection>
      </div>
    </form>
  );
}
