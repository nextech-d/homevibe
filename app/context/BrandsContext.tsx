"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { FEATURED_BRANDS, type Brand } from "../data/brands";
import { fetchBrandsClient } from "../lib/brands.client";

const BrandsContext = createContext<Brand[]>(FEATURED_BRANDS);

export function BrandsProvider({
  initial,
  children,
}: {
  /** Server-loaded brands, or null when the database was unavailable. */
  initial: Brand[] | null;
  children: ReactNode;
}) {
  const [brands, setBrands] = useState<Brand[]>(initial ?? FEATURED_BRANDS);
  const hasServerBrands = Boolean(initial && initial.length > 0);

  // The server already rendered the real list, so only fetch when it couldn't -
  // a storefront without DATABASE_URL still gets brands from the API.
  useEffect(() => {
    if (hasServerBrands) return;
    fetchBrandsClient().then(setBrands);
  }, [hasServerBrands]);

  return <BrandsContext.Provider value={brands}>{children}</BrandsContext.Provider>;
}

export function useNavBrands(): Brand[] {
  return useContext(BrandsContext);
}
