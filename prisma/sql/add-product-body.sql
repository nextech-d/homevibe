-- Adds a long-form body to products.
--
-- `description` is the short rich-text blurb beside the price. This is the
-- space below it: markdown, for the kind of page that answers what a buyer
-- actually asks - what it fits, what it costs to run, what breaks.
--
-- Nullable, so every existing product is unaffected and the section simply
-- does not render until someone writes one.
--
--   psql "$DATABASE_URL" -f prisma/sql/add-product-body.sql

BEGIN;

ALTER TABLE products ADD COLUMN IF NOT EXISTS body text;

COMMIT;
