"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { ALL_CATEGORIES, type Category } from "../data/categories";
import { fetchCategoriesClient } from "../lib/categories";

const CategoriesContext = createContext<Category[]>(ALL_CATEGORIES);

export function CategoriesProvider({
  initial,
  children,
}: {
  /** Server-loaded categories, or null when the database was unavailable. */
  initial: Category[] | null;
  children: ReactNode;
}) {
  const [categories, setCategories] = useState<Category[]>(initial ?? ALL_CATEGORIES);
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

export function useCategories(): Category[] {
  return useContext(CategoriesContext);
}

/** Nav order — all DB categories (seed preserves Gym-first sort). */
export function useNavCategories(): Category[] {
  return useCategories();
}
