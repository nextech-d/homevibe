import test from "node:test";
import assert from "node:assert/strict";
import { productAddOns, relatedProducts, RELATED_LIMIT, type Appliance } from "./inventory";

const product = (
  id: number,
  subcategory: string,
  price: number,
  { category = "Kitchen", brand = "Von", status = "In Stock" } = {}
) => ({ id, subcategory, price, category, brand, status }) as Appliance;

const ids = (items: Appliance[]) => items.map((item) => item.id);

test("a fridge shows fridges, never microwaves from the same category", () => {
  const fridge = product(1, "refrigerators", 26000);
  const related = relatedProducts(
    [product(2, "microwaves", 26000), product(3, "refrigerators", 40000), product(4, "microwaves", 25000)],
    fridge
  );
  assert.deepEqual(ids(related), [3]);
});

test("closest in price first, same brand breaks a tie", () => {
  const fridge = product(1, "refrigerators", 26000, { brand: "Von" });
  const related = relatedProducts(
    [
      product(2, "refrigerators", 30000),
      product(3, "refrigerators", 27000, { brand: "Mika" }),
      product(4, "refrigerators", 25000, { brand: "Von" }),
      product(5, "refrigerators", 26100),
    ],
    fridge
  );
  assert.deepEqual(ids(related), [5, 4, 3, 2]);
});

test("in stock before out of stock, however close the price", () => {
  const tv = product(1, "tvs", 64000, { category: "TVs" });
  const related = relatedProducts(
    [
      product(2, "tvs", 64000, { category: "TVs", status: "Out of Stock" }),
      product(3, "tvs", 90000, { category: "TVs" }),
    ],
    tv
  );
  assert.deepEqual(ids(related), [3, 2]);
});

test("never the product itself or a duplicate, and capped", () => {
  const washer = product(1, "laundry", 50000, { category: "Cleaning" });
  const others = Array.from({ length: 8 }, (_, i) =>
    product(i + 2, "laundry", 50000 + i * 1000, { category: "Cleaning" })
  );
  const related = relatedProducts([washer, others[0], others[0], ...others], washer);
  assert.equal(related.length, RELATED_LIMIT);
  assert.ok(!ids(related).includes(1));
  assert.equal(new Set(ids(related)).size, related.length);
});

test("the family fills in after the subcategory, and nothing beyond it", () => {
  const fridge = product(1, "refrigerators", 26000);
  const related = relatedProducts(
    [product(2, "freezers", 26000), product(3, "refrigerators", 60000), product(4, "microwaves", 26000)],
    fridge
  );
  assert.deepEqual(ids(related), [3, 2]);
});

test("a subcategory with nothing like it gets nothing, not its neighbours", () => {
  const vacuum = product(1, "vacuums", 9000, { category: "Cleaning" });
  assert.deepEqual(relatedProducts([product(2, "laundry", 9000, { category: "Cleaning" })], vacuum), []);
});

test("the accessories catch-all shows no related items", () => {
  const sealant = product(1, "adhesives-and-sealants", 2000, { category: "Others" });
  const related = relatedProducts(
    [product(2, "adhesives-and-sealants", 2000, { category: "Others" })],
    sealant
  );
  assert.deepEqual(related, []);
});

test("a washer gets the footpads as an add-on, unless they're out of stock or unpublished", () => {
  const washer = product(1, "laundry", 50000, { category: "Cleaning" });
  const footpads = product(116, "adhesives-and-sealants", 1500, { category: "Others" });

  const addOns = productAddOns([footpads], washer);
  assert.equal(addOns?.heading, "Useful with this washer");
  assert.deepEqual(ids(addOns?.products ?? []), [116]);

  assert.equal(productAddOns([{ ...footpads, status: "Out of Stock" }], washer), null);
  assert.equal(productAddOns([], washer), null);
});

test("no add-ons outside the configured subcategories", () => {
  const fridge = product(1, "refrigerators", 26000);
  assert.equal(productAddOns([product(116, "adhesives-and-sealants", 1500)], fridge), null);
});
