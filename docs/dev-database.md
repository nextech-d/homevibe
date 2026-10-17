# Development database

Local work runs against its own Neon database, never production's.

## How it's set up

- **Dev database:** Neon project `homevibe-dev`, in the separate free organisation "HomeVibe Dev", region us-east-2.
- **Three gitignored env files**, none of them committed:

  | File | Holds | Read by |
  |---|---|---|
  | `.env.local` | `DATABASE_URL` = dev's **direct** URL (no `-pooler`), as production uses its direct URL | Next, the API, Prisma |
  | `.env.dev-db` | `DEV_DATABASE_URL` (pooled), `DEV_DIRECT_URL` (direct), `PROD_DATABASE_HOST` (production's host, no credentials) | the guard, the setup script |
  | `.env.prod-db` | `PROD_DATABASE_URL`, production's URL. Permissions 600 | the setup script only. Next and Prisma never load it |

- **Data:** dev holds a copy of the catalogue only: brands, categories, subcategories, products (photos are fields on the product), product FAQs, featured slots, site FAQs, site settings and content posts. Customers, orders, order items, addresses, sessions and rate limits are never copied. Those tables exist in dev and start empty.
- **The guard** (`shared/prod-db-guard.ts`): `npm run dev`, `npm run dev:api` and the `db:push` / `db:studio` / `db:seed` / `db:migrate` scripts refuse to start if `DATABASE_URL` is production's host (pooled or direct). They also refuse any remote host when `.env.dev-db` or its `PROD_DATABASE_HOST` is missing. Builds, `prisma generate` and Vercel are not affected.

## Refreshing dev from production

```bash
npx tsx scripts/setup-dev-db.ts                     # dry run: hosts and tables, changes nothing
npx tsx scripts/setup-dev-db.ts --apply --replace   # migrate dev, then replace its catalogue
```

- **Production is only read**, in one read-only transaction. The script refuses if the two URLs are the same database, or if `.env.prod-db` isn't the `PROD_DATABASE_HOST`.
- **Dev is checked first:** the script applies any new migrations and checks that every copied table has the same columns on both sides before it writes anything.
- **`--replace`** empties dev's catalogue and dev's `order_items` (whose product ids would no longer match), in the same transaction as the copy, then resets the id sequences. Without it, the script refuses a dev database that already has a catalogue.
- **A new table** in production stops the script until it's added to one of the two lists at the top of `scripts/setup-dev-db.ts`.

## Deliberately running against production

For a planned content change that has to be made in production itself (for example through the local admin), and only for that task:

1. Give production's URL and the override to that one command. Leave `.env.local` pointing at dev:

   ```bash
   PROD_URL="$(node -p 'require("util").parseEnv(require("fs").readFileSync(".env.prod-db","utf8")).PROD_DATABASE_URL')"
   ALLOW_PROD_DB=1 DATABASE_URL="$PROD_URL" npm run dev:api   # and/or npm run dev, npm run db:studio
   ```

   A `DATABASE_URL` set on the command line wins over `.env.local` for the API, the storefront and Prisma. Anything started without it still uses dev.
2. Make the change, and nothing else.
3. Stop the servers (Ctrl+C) and run `unset PROD_URL`, or close the terminal. The next `npm run dev` is back on dev.
