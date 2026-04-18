"use client";
// Wishlist context — Sprint XXXIII
// Persists saved products in localStorage. Cross-storefront (global).
import { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface WishlistItem {
  productId: string;
  productName: string;
  price: number;
  currency: string;
  creatorHandle: string;
  imageUrl?: string;
  category?: string;
}

interface WishlistContextValue {
  items: WishlistItem[];
  count: number;
  isSaved: (productId: string) => boolean;
  toggle: (item: Omit<WishlistItem, never>) => void;
  remove: (productId: string) => void;
  clear: () => void;
}

const WishlistContext = createContext<WishlistContextValue>({
  items: [],
  count: 0,
  isSaved: () => false,
  toggle: () => {},
  remove: () => {},
  clear: () => {},
});

const STORAGE_KEY = "mam_wishlist";

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setItems(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch { /* ignore */ }
  }, [items]);

  const isSaved = useCallback((productId: string) =>
    items.some(i => i.productId === productId), [items]);

  const toggle = useCallback((item: WishlistItem) => {
    setItems(prev => {
      const exists = prev.some(i => i.productId === item.productId);
      if (exists) return prev.filter(i => i.productId !== item.productId);
      return [...prev, item];
    });
  }, []);

  const remove = useCallback((productId: string) => {
    setItems(prev => prev.filter(i => i.productId !== productId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  return (
    <WishlistContext.Provider value={{ items, count: items.length, isSaved, toggle, remove, clear }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  return useContext(WishlistContext);
}
