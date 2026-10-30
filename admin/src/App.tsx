import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { api, clearToken, getToken } from "./lib/api";
import Shell from "./components/Shell";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import OrdersPage from "./pages/OrdersPage";
import ProductsPage from "./pages/ProductsPage";
import ProductEditPage from "./pages/ProductEditPage";
import ProductCreatedPage from "./pages/ProductCreatedPage";
import BrandCreatedPage from "./pages/BrandCreatedPage";
import CategoryCreatedPage from "./pages/CategoryCreatedPage";
import BrandsPage from "./pages/BrandsPage";
import BrandEditPage from "./pages/BrandEditPage";
import CategoriesPage from "./pages/CategoriesPage";
import CategoryEditPage from "./pages/CategoryEditPage";
import SubcategoryEditPage from "./pages/SubcategoryEditPage";
import FeaturedPage from "./pages/FeaturedPage";
import SiteSettingsPage from "./pages/SiteSettingsPage";
import FaqPage from "./pages/FaqPage";
import CustomersPage from "./pages/CustomersPage";
import SeoOverviewPage from "./pages/SeoOverviewPage";
import SeoGlobalPage from "./pages/SeoGlobalPage";
import ContentPostsPage from "./pages/ContentPostsPage";
import ContentPostEditPage from "./pages/ContentPostEditPage";
import SystemDataPage from "./pages/SystemDataPage";

function ProtectedLayout() {
  const [sessionReady, setSessionReady] = useState(false);
  const [authed, setAuthed] = useState(Boolean(getToken()));

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setAuthed(false);
      setSessionReady(true);
      return;
    }

    api("/auth/admin/me")
      .then(() => {
        setAuthed(true);
      })
      .catch(() => {
        clearToken();
        setAuthed(false);
      })
      .finally(() => {
        setSessionReady(true);
      });
  }, []);

  if (!sessionReady) {
    return <div className="p-8 text-sm text-neutral-500">Checking session…</div>;
  }

  if (!authed) return <Navigate to="/login" replace />;
  return <Shell />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="products/new" element={<ProductEditPage />} />
        <Route path="products/:id/created" element={<ProductCreatedPage />} />
        <Route path="products/:id/edit" element={<ProductEditPage />} />
        <Route path="brands" element={<BrandsPage />} />
        <Route path="brands/new" element={<BrandEditPage />} />
        <Route path="brands/:id/created" element={<BrandCreatedPage />} />
        <Route path="brands/:id/edit" element={<BrandEditPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="categories/new" element={<CategoryEditPage />} />
        <Route path="categories/:id/created" element={<CategoryCreatedPage />} />
        <Route path="categories/:id/edit" element={<CategoryEditPage />} />
        <Route path="subcategories/new" element={<Navigate to="/categories/new" replace />} />
        <Route path="subcategories/:id/edit" element={<SubcategoryEditPage />} />
        <Route path="system-data" element={<SystemDataPage />} />
        <Route path="featured" element={<FeaturedPage />} />
        <Route path="settings" element={<SiteSettingsPage />} />
        <Route path="faq" element={<FaqPage />} />
        <Route path="seo" element={<SeoOverviewPage />} />
        <Route path="seo/global" element={<SeoGlobalPage />} />
        <Route path="content/blog" element={<ContentPostsPage type="blog" />} />
        <Route path="content/blog/new" element={<ContentPostEditPage type="blog" />} />
        <Route path="content/blog/:id/edit" element={<ContentPostEditPage type="blog" />} />
        <Route path="content/articles" element={<ContentPostsPage type="article" />} />
        <Route path="content/articles/new" element={<ContentPostEditPage type="article" />} />
        <Route path="content/articles/:id/edit" element={<ContentPostEditPage type="article" />} />
      </Route>
    </Routes>
  );
}
