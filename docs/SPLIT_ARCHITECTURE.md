# Split architecture (API + Admin + Store)

Patril is split into three apps that can be deployed separately or run together locally.

```
homevibe/          Storefront (Next.js)     → homevibe.co.ke
homevibe/api/      Backend API (Hono)       → api.homevibe.co.ke
homevibe/admin/    Admin UI (Vite React)    → admin.homevibe.co.ke
                              ↓
                         Neon Postgres
```

## Local development

**One command (recommended):**

```bash
npm run dev:all
```

See **[PROGRESS.md](../PROGRESS.md)** for local URLs and module status.

Or run **three terminals**:

```bash
# Terminal 1 — API (port 4000)
npm run dev:api

# Terminal 2 — Admin (port 5173, proxies /api → :4000)
npm run dev:admin

# Terminal 3 — Store (port 3000)
npm run dev
```

### Environment

**API** — copy `api/.env.example` → `api/.env.local` (or reuse root `.env.local` — API loads `../.env.local`):

```
DATABASE_URL=postgresql://...
ADMIN_PASSWORD=your-password
ADMIN_JWT_SECRET=long-random-secret
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

**Admin** — copy `admin/.env.example` → `admin/.env.local`:

```
VITE_API_URL=http://localhost:4000
```

**Store** — add to root `.env.local` when API is running:

```
NEXT_PUBLIC_API_URL=http://localhost:4000
```

When `NEXT_PUBLIC_API_URL` is set, the storefront fetches products from the standalone API. When unset, it uses embedded `/api/*` routes (legacy monolith mode).

## Admin app

Open **http://localhost:5173** — Neon-style dark UI.

| Section | CRUD |
|---------|------|
| Dashboard | Stats (products, orders, pending payments) |
| Orders | View, update status & payment, export CSV |
| Products | Quick price & stock edits |
| Brands | Create, list, delete |
| Categories | Create categories & subcategories |

Sign in with the same `ADMIN_PASSWORD` as the API.

## API endpoints

| Public | Admin (Bearer JWT) |
|--------|-------------------|
| `GET /health` | `GET /admin/dashboard` |
| `GET /products` | `GET/POST/PATCH /admin/products` |
| `GET/POST /orders` | `GET/PATCH /admin/orders` (+ `?status`, `?payment`, `?q`) |
| `POST /auth/login` | `GET/POST /admin/catalog/brands` |
| `POST /auth/register` | `GET/POST /admin/catalog/categories` |
| `GET /account/*` | `GET/POST /admin/catalog/subcategories` |

Admin login: `POST /auth/admin/login` → `{ token }`  
Use header: `Authorization: Bearer <token>`

Customer login: `POST /auth/login` → `{ user, sessionToken }`  
Use header: `Authorization: Bearer <sessionToken>`

## Production deployment

| App | Platform | Domain |
|-----|----------|--------|
| **api** | Railway, Render, Fly.io, or Vercel | `api.yourdomain.com` |
| **admin** | Vercel (static) or Netlify | `admin.yourdomain.com` |
| **store** | Vercel (existing) | `yourdomain.com` |

Set `CORS_ORIGINS` on the API to your store and admin URLs.

Set `VITE_API_URL` and `NEXT_PUBLIC_API_URL` to your production API URL.

## Migration status

| Feature | Standalone API | Admin app | Store wired |
|---------|---------------|-----------|-------------|
| Products read | ✅ | — | ✅ (with `NEXT_PUBLIC_API_URL`) |
| Orders | ✅ | ✅ | Still uses `/api/orders` until store updated |
| Customer auth | ✅ | — | Still uses Next `/api/auth` |
| Embedded `/admin` | — | Replaced by admin app | Legacy (can remove later) |

Next steps: point store checkout and account flows at the external API; remove embedded admin from the Next.js app.

## Splitting into separate Git repos

Each folder (`api/`, `admin/`, store root) can become its own repository. Move `prisma/` source of truth to `homevibe-api` only when the store no longer runs Prisma locally.

## Why the API project needs its own build context

The repository root `.vercelignore` ignores `/api/`. It has to: the shop
project builds from the repository root, where a top-level `api/` directory
is picked up as standalone serverless functions, and the Hono app has far
more than the twelve a Hobby deployment allows.

That same file is applied when the **homevibe-api** project builds from git,
which stripped `api/package.json` and failed every deploy with:

```
npm error enoent Could not read package.json:
  ENOENT: open '/vercel/path0/api/package.json'
```

Between 2026-09-16 and 2026-09-23 the only successful API deploys were manual
`vercel` CLI pushes run from inside `api/`, which upload that directory
directly and never consult the repository root.

The fix is `api/.vercelignore`. Vercel looks for `.vercelignore` in the
project's Root Directory first and only falls back to the repository root
when that file is absent, so simply creating it — deliberately empty — is
enough. No project setting needs changing.

Before, with no `api/.vercelignore`:

```
Found .vercelignore (repository root)
Removed 51 ignored files defined in .vercelignore
  /api/package.json
  ...
Error: Command "npm install" exited with 254
```

After:

```
Found .vercelignore
Removed 0 ignored files defined in .vercelignore
Running "install" command: `npm install`...
```

Keep `api/.vercelignore` in place even while it is empty: deleting it silently
hands the API project the repository root's rules again and breaks every
deploy. `api/` is self-contained — it has its own `package.json`, `prisma/`
and `vercel.json`, and its imports never reach outside the directory — so it
has nothing legitimate to exclude.
