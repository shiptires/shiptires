"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { CartItem } from "@/lib/types";

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (brandSlug: string, modelSlug: string, size: string) => void;
  updateQuantity: (brandSlug: string, modelSlug: string, size: string, quantity: number) => void;
  clearCart: () => void;
  setItems: (items: CartItem[]) => void;
  totalItems: number;
  subtotal: number;
}

const CartContext = createContext<CartContextType | null>(null);

const CART_KEY = "ship-tires-cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItemsState] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_KEY);
      if (stored) setItemsState(JSON.parse(stored));
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) {
      localStorage.setItem(CART_KEY, JSON.stringify(items));
    }
  }, [items, loaded]);

  const addItem = useCallback((item: CartItem) => {
    setItemsState((prev) => {
      const existing = prev.find(
        (i) => i.brandSlug === item.brandSlug && i.modelSlug === item.modelSlug && i.size === item.size
      );
      if (existing) {
        return prev.map((i) =>
          i.brandSlug === item.brandSlug && i.modelSlug === item.modelSlug && i.size === item.size
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        );
      }
      return [...prev, item];
    });
  }, []);

  const removeItem = useCallback((brandSlug: string, modelSlug: string, size: string) => {
    setItemsState((prev) =>
      prev.filter((i) => !(i.brandSlug === brandSlug && i.modelSlug === modelSlug && i.size === size))
    );
  }, []);

  const updateQuantity = useCallback((brandSlug: string, modelSlug: string, size: string, quantity: number) => {
    if (quantity < 1) return;
    setItemsState((prev) =>
      prev.map((i) =>
        i.brandSlug === brandSlug && i.modelSlug === modelSlug && i.size === size
          ? { ...i, quantity }
          : i
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setItemsState([]);
  }, []);

  const setItems = useCallback((newItems: CartItem[]) => {
    setItemsState(newItems);
  }, []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, setItems, totalItems, subtotal }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
