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

test("a brand with one product, or none, isn't listed", () => {
  const order = navBrands([brand("Shock Pad", 1), brand("TCL", 38), brand("Empty", 0), brand("Pair", 2)]);
  assert.deepEqual(order.map((b) => b.name), ["TCL", "Pair"]);
});

test("a featured brand is listed whatever its product count, in count order", () => {
  const order = navBrands([
    brand("Shock Pad", 1),
    brand("Samsung", 1, true),
    brand("Hisense", 58),
    brand("Coming Soon", 0, true),
    brand("Von", 13),
  ]);
  assert.deepEqual(order.map((b) => b.name), ["Hisense", "Von", "Samsung", "Coming Soon"]);
});
