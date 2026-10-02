-- Per-product questions and answers.
--
-- The site has one FAQ, on the homepage, about delivery and payment. This is
-- for the questions that belong to a single product - which gas, what warranty,
-- does it need a stabiliser - rendered on the product page and described by
-- FAQPage markup scoped to that page.
--
-- Cascades on product delete: the questions have no meaning without it.
--
--   psql "$DATABASE_URL" -f prisma/sql/add-product-faqs.sql

BEGIN;

CREATE TABLE IF NOT EXISTS product_faqs (
  id         serial PRIMARY KEY,
  product_id integer NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  question   text NOT NULL,
  answer     text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS product_faqs_product_id_idx ON product_faqs (product_id);

COMMIT;
