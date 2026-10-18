"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { ALL_CATEGORIES, type NavCategory } from "../data/categories";
import { fetchCategoriesClient } from "../lib/categories";

const CategoriesContext = createContext<NavCategory[]>(ALL_CATEGORIES);

export function CategoriesProvider({
  initial,
  children,
}: {
  /** Server-loaded categories, or null when the database was unavailable. */
  initial: NavCategory[] | null;
  children: ReactNode;
}) {
  const [categories, setCategories] = useState<NavCategory[]>(initial ?? ALL_CATEGORIES);
  const hasServerCategories = Boolean(initial && initial.length > 0);

  // The server already rendered the real list, so only fetch when it couldn't -
  // a storefront without DATABASE_URL still gets categories from the API.
  useEffect(() => {
    if (hasServerCategories) return;
    fetchCategoriesClient().then(setCategories);
  }, [hasServerCategories]);

  return (
    <CategoriesContext.Provider value={categories}>{children}</CategoriesContext.Provider>
  );
}

export function useCategories(): NavCategory[] {
  return useContext(CategoriesContext);
}

/** Nav order — all DB categories (seed preserves Gym-first sort). */
export function useNavCategories(): NavCategory[] {
  return useCategories();
}
