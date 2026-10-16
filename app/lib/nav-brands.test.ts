import test from "node:test";
import assert from "node:assert/strict";
import { navBrands } from "../../shared/nav-brands";

const brand = (name: string, products: number, isFeatured = false) => ({
  name,
  isFeatured,
  _count: { products },
});

test("busiest brand first, name breaks a tie", () => {
  const order = navBrands([brand("Von", 13), brand("Hisense", 58), brand("Mika", 5), brand("Ramtons", 21), brand("Skyworth", 5)]);
  assert.deepEqual(order.map((b) => b.name), ["Hisense", "Ramtons", "Von", "Mika", "Skyworth"]);
});

test("every brand with a published product is listed, one-product brands too", () => {
  const order = navBrands([brand("Shock Pad", 1), brand("TCL", 38), brand("Samsung", 1)]);
  assert.deepEqual(order.map((b) => b.name), ["TCL", "Samsung", "Shock Pad"]);
});

test("a brand with no published products isn't listed unless it's featured", () => {
  const order = navBrands([brand("Empty", 0), brand("Hisense", 58), brand("Coming Soon", 0, true)]);
  assert.deepEqual(order.map((b) => b.name), ["Hisense", "Coming Soon"]);
});
