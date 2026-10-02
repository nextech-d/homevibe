-- Adds created_at and updated_at to products.
--
-- The sitemap reported the same <lastmod> for all 145 URLs - the moment the
-- file was generated - because products had no timestamp to report. Content
-- posts already carry both; products were the gap.
--
-- Additive and safe on a live database: both columns are NOT NULL with a
-- default, so existing rows get now() and nothing has to be backfilled. Prisma
-- maintains updated_at from the @updatedAt attribute on write.
--
-- Run once per environment, before deploying the matching code:
--   psql "$DATABASE_URL" -f prisma/sql/add-product-timestamps.sql

BEGIN;

ALTER TABLE products ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

COMMIT;
