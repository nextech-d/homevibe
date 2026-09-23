import { Hono } from "hono";
import { cors } from "hono/cors";
import { verifyAdminToken } from "./lib/admin-jwt.js";
import { extractBearerToken } from "./lib/session.js";
import { handleGetProducts, handleGetProduct } from "./routes/products.js";
import { ordersRoute, adminOrdersRoute } from "./routes/orders.js";
import { adminProductsRoute } from "./routes/admin/products.js";
import { adminCatalogRoute } from "./routes/admin/catalog.js";
import { adminDashboardRoute } from "./routes/admin/dashboard.js";
import { adminUploadsRoute } from "./routes/admin/uploads.js";
import { adminStorefrontRoute } from "./routes/admin/storefront.js";
import { adminCustomersRoute } from "./routes/admin/customers.js";
import { adminSeoRoute } from "./routes/admin/seo.js";
import { adminContentRoute } from "./routes/admin/content.js";
import { catalogRoute } from "./routes/catalog.js";
import { storefrontRoute } from "./routes/storefront.js";
import { authRoute, accountRoute } from "./routes/auth.js";

export function createApp(basePath = "") {
  const app = basePath ? new Hono().basePath(basePath) : new Hono();

  const defaultOrigins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:5174",
    "https://admin.homevibe.co.ke",
    "https://homevibe-admin.vercel.app",
    "https://homevibe.co.ke",
    "https://www.homevibe.co.ke",
    process.env.ADMIN_APP_URL?.trim(),
    process.env.SITE_URL?.trim(),
  ].filter(Boolean) as string[];

  const origins = (process.env.CORS_ORIGINS ?? defaultOrigins.join(","))
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  app.use(
    "*",
    cors({
      origin: (origin) => {
        if (!origin) return origin;
        if (origins.includes(origin)) return origin;
        if (/^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(origin)) return origin;
        return "";
      },
      allowHeaders: ["Content-Type", "Authorization"],
      allowMethods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
      credentials: true,
    })
  );

  app.get("/health", (c) => c.json({ ok: true, service: "homevibe-api" }));

  app.get("/products", async (c) => {
    try {
      const data = await handleGetProducts();
      return c.json(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load products.";
      return c.json({ success: false, message }, 503);
    }
  });

  app.get("/products/:id", async (c) => {
    const id = c.req.param("id");
    if (!id?.trim()) return c.json({ success: false, message: "Invalid product." }, 400);
    try {
      const data = await handleGetProduct(id);
      if (!data) return c.json({ success: false, message: "Product not found." }, 404);
      return c.json(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load product.";
      return c.json({ success: false, message }, 503);
    }
  });

  app.route("/orders", ordersRoute);
  app.route("/catalog", catalogRoute);
  app.route("/storefront", storefrontRoute);
  app.route("/auth", authRoute);
  app.route("/account", accountRoute);

  const adminAuth = async (c: import("hono").Context, next: () => Promise<void>) => {
    if (c.req.method === "OPTIONS") {
      await next();
      return;
    }

    const token = extractBearerToken(c.req.header("Authorization"));
    const valid = await verifyAdminToken(token ?? undefined);
    if (!valid) {
      return c.json(
        {
          success: false,
          message: "Unauthorized. Sign in again — your session may have expired.",
        },
        401
      );
    }
    await next();
  };

  app.use("/admin/*", adminAuth);
  app.route("/admin/orders", adminOrdersRoute);
  app.route("/admin/products", adminProductsRoute);
  app.route("/admin/catalog", adminCatalogRoute);
  app.route("/admin/dashboard", adminDashboardRoute);
  app.route("/admin/uploads", adminUploadsRoute);
  app.route("/admin/storefront", adminStorefrontRoute);
  app.route("/admin/customers", adminCustomersRoute);
  app.route("/admin/seo", adminSeoRoute);
  app.route("/admin/content", adminContentRoute);

  app.onError((err, c) => {
    console.error(err);
    const message = err instanceof Error ? err.message : "Internal server error.";
    return c.json({ success: false, message }, 500);
  });

  return app;
}
