import test from "node:test";
import assert from "node:assert/strict";
import { getAllSearchResults, searchProducts, SEARCH_QUERY_MAX_LENGTH } from "./searchProducts";

const item = (id: number, name: string, brand: string, category = "TVs", subcategory = "tvs") => ({
  id,
  name,
  brand,
  category,
  subcategory,
});

const index = [
  item(1, "Hisense 55A6QKEN 55-Inch 4K TV", "Hisense"),
  item(2, "Von 125L Fridge", "Von", "Kitchen", "refrigerators"),
  item(3, "TCL 55C6K 55-Inch Mini LED TV", "TCL"),
  item(4, "Hisense REF203DR Fridge", "Hisense", "Kitchen", "refrigerators"),
];

test("matches name, brand, category and subcategory, case-insensitively, in catalogue order", () => {
  assert.deepEqual(getAllSearchResults("HISENSE", index).map((p) => p.id), [1, 4]);
  assert.deepEqual(getAllSearchResults("kitchen", index).map((p) => p.id), [2, 4]);
  assert.deepEqual(getAllSearchResults("refrigerators", index).map((p) => p.id), [2, 4]);
  assert.deepEqual(getAllSearchResults("55", index).map((p) => p.id), [1, 3]);
});

test("a blank query finds nothing, and the limit cuts the list without reordering it", () => {
  assert.deepEqual(getAllSearchResults("   ", index), []);
  assert.deepEqual(searchProducts("tv", 1, index).map((p) => p.id), [1]);
});

test("a query is cut to its first SEARCH_QUERY_MAX_LENGTH characters", () => {
  const long = "hisense" + "x".repeat(SEARCH_QUERY_MAX_LENGTH);
  assert.deepEqual(getAllSearchResults(long, index), []);
  assert.deepEqual(getAllSearchResults("hisense".padEnd(SEARCH_QUERY_MAX_LENGTH + 5, " "), index).map((p) => p.id), [1, 4]);
});
