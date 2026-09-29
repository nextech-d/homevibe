-- Adds SEO meta overrides to categories and subcategories.
--
-- Additive and safe to run on a live database: both columns are nullable with
-- no default, so existing rows are untouched and the storefront keeps using its
-- generated fallbacks until someone fills a value in the admin.
--
-- Run once per environment, before deploying the matching code:
--   psql "$DATABASE_URL" -f prisma/sql/add-category-meta.sql
--
-- Reverse with:
--   ALTER TABLE categories DROP COLUMN meta_title, DROP COLUMN meta_description;
--   ALTER TABLE subcategories DROP COLUMN meta_title, DROP COLUMN meta_description;

ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS meta_title TEXT,
  ADD COLUMN IF NOT EXISTS meta_description TEXT;

ALTER TABLE subcategories
  ADD COLUMN IF NOT EXISTS meta_title TEXT,
  ADD COLUMN IF NOT EXISTS meta_description TEXT;
