-- The options a customer chose for each order item (Length: 45M, ...), as a
-- snapshot of the type and value names: [{"type": "Length", "value": "45M"}].
-- Existing items, and items for products with no options, hold [].
--
-- Safe to run before the deploy: the old code never reads the column and the
-- default fills it on every insert.

-- AlterTable
ALTER TABLE "order_items" ADD COLUMN "options" JSONB NOT NULL DEFAULT '[]';
