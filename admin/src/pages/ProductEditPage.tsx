import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { api } from "../lib/api";
import ProductForm from "../components/ProductForm";
import ProductCreatedView from "../views/ProductCreatedView";
import type { AdminProductDetail, BrandOption, SubcategoryOption } from "../lib/products";

export default function ProductEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id || id === "new";

  const [brands, setBrands] = useState<BrandOption[]>([]);
  const [subcategories, setSubcategories] = useState<SubcategoryOption[]>([]);
  const [product, setProduct] = useState<AdminProductDetail | undefined>();
  const [createdId, setCreatedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const options = await api<{
          brands: BrandOption[];
          subcategories: SubcategoryOption[];
        }>("/admin/products/options");

        setBrands(options.brands);
        setSubcategories(options.subcategories);

        if (!isNew && id) {
          const detail = await api<{ product: AdminProductDetail }>(`/admin/products/${id}`);
          setProduct(detail.product);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load product");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, isNew]);

  if (createdId) {
    return (
      <ProductCreatedView
        entityId={String(createdId)}
        onCreateAnother={() => setCreatedId(null)}
      />
    );
  }

  if (loading) {
    return <div className="p-8 text-sm text-neutral-500">Loading…</div>;
  }

  if (error) {
    return (
      <div className="p-8">
        <p className="text-sm text-red-400">{error}</p>
        <button
          type="button"
          onClick={() => navigate("/products")}
          className="mt-4 text-xs text-neutral-500 hover:text-white"
        >
          Back to products
        </button>
      </div>
    );
  }

  if (!isNew && !product) {
    return (
      <div className="p-8 text-sm text-neutral-500">
        Product not found.{" "}
        <Link to="/products" className="text-[#00e599] hover:underline">
          Back to list
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8">
      <Link
        to="/products"
        className="mb-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-500 hover:text-white"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to products
      </Link>
      <h1 className="mb-6 text-xl font-semibold text-white">
        {isNew ? "Add product" : `Edit: ${product?.name}`}
      </h1>
      <ProductForm
        brands={brands}
        subcategories={subcategories}
        product={product}
        mode={isNew ? "create" : "edit"}
        onCreated={setCreatedId}
      />
    </div>
  );
}
