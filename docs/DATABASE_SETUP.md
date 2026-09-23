# Database setup (Neon + Prisma)

Day 1 wires the **product catalog** to PostgreSQL. Day 2 adds **order persistence** — checkout saves to Postgres without online payments or order-tracking UI yet.

## 1. Create Neon database

1. Go to [neon.tech](https://neon.tech) and sign up / log in.
2. **New Project** → name it `homevibe`.
3. Copy the **connection string** (starts with `postgresql://`).

## 2. Local environment

```bash
cp .env.example .env.local
```

Edit `.env.local` and paste your Neon URL:

```
DATABASE_URL=postgresql://...
```

## 3. Create tables and seed data

```bash
npm run db:push
npm run db:seed
```

- `db:push` — creates tables from `prisma/schema.prisma`
- `db:seed` — loads brands, categories, 20 products, featured homepage layout

Browse data:

```bash
npm run db:studio
```

## 4. Verify locally

```bash
npm run dev
```

Open `/api/products` — you should see JSON from the database (same 20 products).

## 5. Vercel production

In **Vercel → Project → Settings → Environment Variables**:

| Name | Value |
|------|--------|
| `DATABASE_URL` | Your Neon **production** connection string |
| `NEXT_PUBLIC_DEMO_MODE` | `true` (until checkout is production-ready) |

After adding `DATABASE_URL`, redeploy. Then run **once** from your machine against the production DB:

```bash
DATABASE_URL="your-neon-url" npm run db:push
DATABASE_URL="your-neon-url" npm run db:seed
```

Or use Neon's SQL editor — tables must exist before the live site reads from DB.

## Schema overview

| Table | Purpose |
|-------|---------|
| `brands` | Sub-Zero, Bosch, Life Fitness, … |
| `categories` | Gym, Cooking, Refrigeration, … |
| `subcategories` | cardio, ovens-ranges, … |
| `products` | Full catalog with prices, photos, highlights |
| `featured_home_slots` | Homepage 4-column layout |
| `orders` | Customer checkout orders |
| `order_items` | Line items per order |

## Orders (Day 2)

After pulling Day 2 changes, create the new tables:

```bash
npm run db:push
```

Checkout POSTs to `/api/orders` and saves delivery details + cart items. Payment is arranged manually (WhatsApp/phone) until payments are integrated.

## Admin (Day 3)

Password-protected panel at **`/admin`** (not linked from the public site).

1. Add to `.env.local` and Vercel:

```
ADMIN_PASSWORD=your-strong-password-here
```

2. Sign in at `/admin/login`
3. **Orders** — view details, update delivery status
4. **Products** — edit price and stock status

Use a long random password. Rotate it if it is ever exposed.

## SEO & Analytics

Set your public URL for sitemaps and social previews:

```
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

The app ships with:

- `/sitemap.xml` — home, categories, brands, and product pages
- `/robots.txt` — blocks admin, account, checkout, and API routes
- Open Graph + Twitter metadata on product, category, and brand pages
- JSON-LD (`Organization` + `WebSite`) on every page

**Vercel Analytics:** enable in **Vercel → Project → Analytics**, then redeploy. The `@vercel/analytics` component is already in the root layout. Analytics does not run in local dev.

## Email notifications & manual payments (Day 6)

Day 6 adds **server-side pricing**, **manual payment tracking**, and **polished email hooks** (no M-Pesa integration yet).

### Server-side checkout validation

Checkout no longer trusts prices from the browser. `POST /api/orders`:

- Loads each product from Postgres at order time
- Rejects unpublished or out-of-stock items
- Recalculates the total server-side and saves price snapshots

### Manual payment status

Orders have a `payment_status` field (`pending` | `paid` | `refunded`):

- Defaults to **pending** on new orders
- Admin can mark **Paid** or **Refunded** in `/admin/orders`
- Customers see payment status on `/track-order`

After pulling Day 6 changes, run:

```bash
npm run db:push
```

### Email (Resend)

When `RESEND_API_KEY` is set:

- **New order** — team notification + customer confirmation (with track-order link)
- **Status update** — customer email when admin changes delivery status

Sign up at [resend.com](https://resend.com), verify your domain (or use their sandbox sender for testing), and add to Vercel:

```
RESEND_API_KEY=re_...
EMAIL_FROM=HomeVibe <orders@yourdomain.com>
ORDER_NOTIFY_EMAIL=hello@homevibe.co.ke
```

## Order tracking (Day 5)

Customers can track orders at **`/track-order`** using their reference (e.g. `PTL-123456`).

- Lookup reads from Postgres via `GET /api/orders?trackingId=`
- Checkout success shows **Track order** + optional **My orders** when signed in
- Account order history links to track status
- Admin can update status in `/admin/orders` — customers see the update when they track

Payment integration (M-Pesa STK / card) can be added in a future phase. Until then, mark orders **Paid** manually in admin after receiving M-Pesa or bank transfer.

## Email notifications (Day 4)

See **Day 6** above for the full email setup (order confirmations, status updates, and Resend env vars).

## Customer accounts (Day 4)

Customers can register at **`/account/register`**, sign in, view order history, and save delivery addresses. Checkout prefills from their account when signed in.

## Fallback

If `DATABASE_URL` is missing or the DB is empty, the app falls back to static `products.ts` so the site never goes blank during setup.

