"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { FEATURED_BRANDS, type Brand } from "../data/brands";
import { fetchBrandsClient } from "../lib/brands.client";

const BrandsContext = createContext<Brand[]>(FEATURED_BRANDS);

export function BrandsProvider({ children }: { children: ReactNode }) {
  const [brands, setBrands] = useState<Brand[]>(FEATURED_BRANDS);

  useEffect(() => {
    fetchBrandsClient().then(setBrands);
  }, []);

  return <BrandsContext.Provider value={brands}>{children}</BrandsContext.Provider>;
}

export function useNavBrands(): Brand[] {
  return useContext(BrandsContext);
}
