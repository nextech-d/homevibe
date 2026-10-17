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
type InventoryState = {
  products: Appliance[];
  /** "error" when the fetch failed: an empty list then means nothing, not "no products". */
  status: "loading" | "ready" | "error";
};

const ProductsContext = createContext<InventoryState>({ products: [], status: "loading" });

export function ProductsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<InventoryState>({ products: [], status: "loading" });

  useEffect(() => {
    fetchInventoryClient().then(
      (products) => setState({ products, status: "ready" }),
      (error) => {
        console.error("Failed to load products:", error);
        setState({ products: [], status: "error" });
      }
    );
  }, []);

  return <ProductsContext.Provider value={state}>{children}</ProductsContext.Provider>;
}

export function useInventory(): Appliance[] {
  return useContext(ProductsContext).products;
}

/** For pages that must not present an empty list as a real answer. */
export function useInventoryStatus(): InventoryState["status"] {
  return useContext(ProductsContext).status;
}
