'use client';

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { readMigrated } from '../lib/storage-migration';
import { PIXEL_CURRENCY, pixelContentId, trackPixel } from '../lib/pixel';

export type CartItem = {
  id: number;
  slug?: string;
  name: string;
  price: number;
  qty: number;
  image: string;
};

export type CartToast = {
  itemName: string;
  qty: number;
};

type AddItemOptions = {
  openDrawer?: boolean;
};

type CartContextProps = {
  items: CartItem[];
  hydrated: boolean;
  toast: CartToast | null;
  dismissToast: () => void;
  addItem: (item: Omit<CartItem, 'qty'>, qty?: number, options?: AddItemOptions) => void;
  removeItem: (id: number) => void;
  updateQty: (id: number, qty: number) => void;
  /** Replaces the stored price of each id given, leaving everything else as it is. */
  updatePrices: (prices: Record<number, number>) => void;
  total: number;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextProps | undefined>(undefined);

const CART_STORAGE_KEY = "homevibe_cart";
const LEGACY_CART_STORAGE_KEY = "patril_cart";

function readStoredCart(): CartItem[] {
  try {
    const stored = readMigrated(localStorage, CART_STORAGE_KEY, LEGACY_CART_STORAGE_KEY);
    const parsed = stored ? (JSON.parse(stored) as unknown) : null;
    if (!Array.isArray(parsed)) return [];
    return parsed as CartItem[];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [toast, setToast] = useState<CartToast | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setItems(readStoredCart());
    setHydrated(true);
  }, []);

  const dismissToast = () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(null);
  };

  const showToast = (itemName: string, qty: number) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ itemName, qty });
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  };

  const saveItems = (newItems: CartItem[]) => {
    setItems(newItems);
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newItems));
    } catch (e) {
      console.error("Failed to save cart items to localStorage", e);
    }
  };

  const addItem = (item: Omit<CartItem, 'qty'>, qty = 1, options?: AddItemOptions) => {
    const amount = Math.max(1, qty);
    const wasEmpty = items.length === 0;
    let updated: CartItem[];
    const existing = items.find(i => i.id === item.id);
    if (existing) {
      updated = items.map(i =>
        i.id === item.id ? { ...i, qty: i.qty + amount } : i
      );
    } else {
      updated = [...items, { ...item, qty: amount }];
    }
    saveItems(updated);

    // Reported here rather than at each button, so every path into the cart -
    // product page, drawer, anything added later - counts once.
    trackPixel('AddToCart', {
      content_type: 'product',
      content_ids: [pixelContentId(item.id)],
      content_name: item.name,
      contents: [{ id: pixelContentId(item.id), quantity: amount, item_price: item.price }],
      value: item.price * amount,
      currency: PIXEL_CURRENCY,
    });

    const shouldOpenDrawer = options?.openDrawer ?? wasEmpty;
    if (shouldOpenDrawer) {
      dismissToast();
      setCartOpen(true);
    } else {
      setCartOpen(false);
      showToast(item.name, amount);
    }
  };

  const removeItem = (id: number) => {
    saveItems(items.filter(i => i.id !== id));
  };

  const updateQty = (id: number, qty: number) => {
    if (qty < 1) {
      removeItem(id);
      return;
    }
    saveItems(items.map(i => i.id === id ? { ...i, qty } : i));
  };

  // From the state updater rather than the render's items, so a price check
  // that lands just after a quantity change can't undo it.
  const updatePrices = (prices: Record<number, number>) => {
    setItems((current) => {
      const next = current.map((i) => (prices[i.id] !== undefined ? { ...i, price: prices[i.id] } : i));
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.error("Failed to save cart items to localStorage", e);
      }
      return next;
    });
  };

  const clearCart = () => {
    saveItems([]);
  };

  const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);

  return (
    <CartContext.Provider value={{ items, hydrated, toast, dismissToast, addItem, removeItem, updateQty, updatePrices, total, cartOpen, setCartOpen, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
