import { getInventory, getPublishedProductByParam } from "../lib/inventory.js";

export async function handleGetProducts() {
  const products = await getInventory();
  return { success: true as const, products };
}

export async function handleGetProduct(param: string) {
  const product = await getPublishedProductByParam(param);
  if (!product) return null;
  return { success: true as const, product };
}
