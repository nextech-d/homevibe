-- 1. A product's brand becomes optional, so the admin can save one with no
--    brand. The foreign key is unchanged (ON DELETE RESTRICT): a brand that
--    still has products can't be deleted.
-- 2. "System data": option types (Size, Color, ...) with their values, and the
--    values ticked on each product. Descriptive only - no price or stock per
--    option. Deleting a value or type removes it from products (CASCADE); the
--    admin asks before doing that.
--
-- Safe to run before or after the deploy: the old code always sets a brand
-- and never reads the new tables.

-- AlterTable
ALTER TABLE "products" ALTER COLUMN "brand_id" DROP NOT NULL;

-- CreateTable
CREATE TABLE "option_types" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "option_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "option_values" (
    "id" SERIAL NOT NULL,
    "option_type_id" INTEGER NOT NULL,
    "value" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "option_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_option_values" (
    "product_id" INTEGER NOT NULL,
    "option_value_id" INTEGER NOT NULL,

    CONSTRAINT "product_option_values_pkey" PRIMARY KEY ("product_id","option_value_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "option_types_name_key" ON "option_types"("name");

-- CreateIndex
CREATE INDEX "option_values_option_type_id_idx" ON "option_values"("option_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "option_values_option_type_id_value_key" ON "option_values"("option_type_id", "value");

-- CreateIndex
CREATE INDEX "product_option_values_option_value_id_idx" ON "product_option_values"("option_value_id");

-- AddForeignKey
ALTER TABLE "option_values" ADD CONSTRAINT "option_values_option_type_id_fkey" FOREIGN KEY ("option_type_id") REFERENCES "option_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_option_values" ADD CONSTRAINT "product_option_values_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_option_values" ADD CONSTRAINT "product_option_values_option_value_id_fkey" FOREIGN KEY ("option_value_id") REFERENCES "option_values"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- The two starting types, with no values: the admin adds those.
INSERT INTO "option_types" ("name", "sort_order") VALUES ('Size', 0), ('Color', 1)
ON CONFLICT ("name") DO NOTHING;
