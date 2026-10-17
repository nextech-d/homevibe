import test, { afterEach } from "node:test";
import assert from "node:assert/strict";
import { fetchInventoryClient } from "./inventory";

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

const answer = (status: number, body: unknown) => {
  globalThis.fetch = async () =>
    new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
};

test("an API that can't reach the database rejects, rather than reading as no products", async () => {
  answer(503, { success: false, message: "Failed to load products." });
  await assert.rejects(fetchInventoryClient());
});

test("a reply without a product list rejects", async () => {
  answer(200, { success: false });
  await assert.rejects(fetchInventoryClient());
});

test("a network failure rejects", async () => {
  globalThis.fetch = async () => {
    throw new TypeError("fetch failed");
  };
  await assert.rejects(fetchInventoryClient());
});

test("a real answer resolves, even an empty one", async () => {
  answer(200, { success: true, products: [] });
  assert.deepEqual(await fetchInventoryClient(), []);
});
