-- Records that someone has checked the specific promises in a product's copy.
--
-- The publish guard refuses copy that makes a promise nobody has verified - a
-- box contents list, a free accessory, a price. This column is the escape
-- hatch: it is set when someone confirms the promise against a carton or the
-- manufacturer's spec sheet, and publishing is allowed from then on.
--
-- A timestamp rather than a boolean, so the catalogue records when the claim
-- was checked and not merely that someone said so. NULL means unchecked, which
-- is the honest default for all 120 existing rows - nobody has opened a box.
--
-- Additive and safe on a live database: nullable, no default, no backfill.
--
--   psql "$DATABASE_URL" -f prisma/sql/add-product-claims-checked.sql

BEGIN;

ALTER TABLE products ADD COLUMN IF NOT EXISTS claims_checked_at timestamptz;

COMMIT;
