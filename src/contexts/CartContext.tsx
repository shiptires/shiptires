"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { CartItem } from "@/lib/types";
import { TIRE_PROTECTION_PRICE } from "@/lib/constants";

export { TIRE_PROTECTION_PRICE };

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (brandSlug: string, modelSlug: string, size: string) => void;
  updateQuantity: (brandSlug: string, modelSlug: string, size: string, quantity: number) => void;
  clearCart: () => void;
  setItems: (items: CartItem[]) => void;
  totalItems: number;
  subtotal: number;
  isCartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  tireProtection: boolean;
  setTireProtection: (enabled: boolean) => void;
  protectionTotal: number;
}

const CartContext = createContext<CartContextType | null>(null);

const CART_KEY = "ship-tires-cart";
const PROTECTION_KEY = "ship-tires-protection";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItemsState] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [isCartOpen, setCartOpen] = useState(false);
  const [tireProtection, setTireProtectionState] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_KEY);
      if (stored) setItemsState(JSON.parse(stored));
      const prot = localStorage.getItem(PROTECTION_KEY);
      if (prot === "true") setTireProtectionState(true);
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
    setTireProtectionState(false);
    localStorage.removeItem(PROTECTION_KEY);
  }, []);

  const setTireProtection = useCallback((enabled: boolean) => {
    setTireProtectionState(enabled);
    localStorage.setItem(PROTECTION_KEY, String(enabled));
  }, []);

  const setItems = useCallback((newItems: CartItem[]) => {
    setItemsState(newItems);
  }, []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0);
  const protectionTotal = tireProtection ? totalItems * TIRE_PROTECTION_PRICE : 0;

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, setItems, totalItems, subtotal, isCartOpen, setCartOpen, tireProtection, setTireProtection, protectionTotal }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
