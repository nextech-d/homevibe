"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { fetchInventoryClient, type Appliance } from "../lib/inventory";

/**
 * Empty until the fetch lands. It used to start from the demo catalogue in
 * app/data/products.ts, which meant every server render that read this context
 * shipped invented products at invented prices - the product page's related
 * rail was doing exactly that in production. Nothing is better than fiction.
 */
const ProductsContext = createContext<Appliance[]>([]);

export function ProductsProvider({ children }: { children: ReactNode }) {
  const [inventory, setInventory] = useState<Appliance[]>([]);

  useEffect(() => {
    fetchInventoryClient().then(setInventory);
  }, []);

  return (
    <ProductsContext.Provider value={inventory}>{children}</ProductsContext.Provider>
  );
}

export function useInventory(): Appliance[] {
  return useContext(ProductsContext);
}
