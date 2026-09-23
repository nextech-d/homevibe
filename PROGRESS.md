# HomeVibe — local progress tracker

**Start everything (one command):**

```bash
npm run dev:all
```

---

## Your local URLs

| App | URL | Purpose |
|-----|-----|---------|
| **Storefront** | http://localhost:3000 | Public shop — browse, cart, checkout |
| **Admin** | http://localhost:5173 | Operations — orders, products, catalog |
| **API** | http://localhost:4000/health | Backend health check |

**Production store:** https://homevibe.co.ke

---

## Module status

| Module | Status | Notes |
|--------|--------|-------|
| Storefront | ✅ Live | Guest-first header (no Sign in); cart + checkout |
| API (Hono) | ✅ Local | Orders, products, catalog, uploads, JWT admin auth |
| Admin app | ✅ Local | Dark UI — sidebar grouped Commerce / Catalog |
| Categories admin | ✅ | Search, stats, delete, edit subcategories panel |
| Store categories | ✅ | Nav, footer, category pages read from DB |
| Products admin | ✅ | Two-column form, image uploads, meta fields |
| Orders admin | ✅ | Filters, detail, CSV, payment/status rules |
| Checkout rules | ✅ | Server pricing; blocks out-of-stock & low-stock |
| Order rules | ✅ | Fulfillment requires paid; refund requires paid |
| Image uploads | ✅ Dev | Local `public/uploads/`; prod → `BLOB_READ_WRITE_TOKEN` |
| Legacy `/admin` | ⚠️ Optional | Disable with `ADMIN_APP_URL` + `DISABLE_LEGACY_ADMIN` |
| Store → external API | ⚠️ Partial | Products via `NEXT_PUBLIC_API_URL`; checkout still Next `/api` |
| Production deploy | ⚠️ Pending | API + admin not deployed separately yet |

---

## Env checklist (`.env.local` at repo root)

```bash
DATABASE_URL=...
ADMIN_PASSWORD=...
ADMIN_JWT_SECRET=...
NEXT_PUBLIC_API_URL=http://localhost:4000   # store → split API for products
ADMIN_APP_URL=http://localhost:5173         # optional: redirect legacy /admin
```

API also reads root `.env.local`. Admin dev proxies `/api` → `:4000`.

---

## Quick smoke test

1. Open **http://localhost:5173** → sign in with `ADMIN_PASSWORD`
2. **Products** → add or edit a product (upload images)
3. Open **http://localhost:3000** → confirm product appears
4. Place a test order → track in **Admin → Orders**

---

*Last updated: Aug 2026 — update the module table as you ship.*
