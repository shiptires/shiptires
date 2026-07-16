"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/contexts/CartContext";

interface StickyBuyBarProps {
  price: number;
  brand: string;
  brandSlug: string;
  model: string;
  modelSlug: string;
  size: string;
  loadIndex: number;
  speedRating: string;
  image?: string;
  tireId?: number;
}

export default function StickyBuyBar({
  price,
  brand,
  brandSlug,
  model,
  modelSlug,
  size,
  loadIndex,
  speedRating,
  image,
  tireId,
}: StickyBuyBarProps) {
  const { addItem, setCartOpen } = useCart();
  const [visible, setVisible] = useState(false);
  const [qty, setQty] = useState(4);

  useEffect(() => {
    const target = document.getElementById("quantity-picker");
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(!entry.isIntersecting);
      },
      { threshold: 0 }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  const handleAdd = () => {
    addItem({
      brand,
      brandSlug,
      model,
      modelSlug,
      size,
      price,
      quantity: qty,
      loadIndex,
      speedRating,
      image,
      tireId,
    });
    setCartOpen(true);

  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden animate-slide-up" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="bg-white border-t border-gray-200 shadow-[0_-4px_12px_rgba(0,0,0,0.1)] px-4 py-3">
        <div className="flex items-center gap-3">
          {/* Price */}
          <div className="flex-shrink-0">
            <span className="text-lg font-bold text-gray-900">${price}</span>
            <span className="text-xs text-gray-500">/tire</span>
          </div>

          {/* Compact quantity selector */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setQty(Math.max(1, qty - 1))}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 text-sm font-bold text-gray-600"
            >
              -
            </button>
            <span className="w-8 text-center text-sm font-bold">{qty}</span>
            <button
              onClick={() => setQty(qty + 1)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 text-sm font-bold text-gray-600"
            >
              +
            </button>
          </div>

          {/* Add to Cart button */}
          <button
            onClick={handleAdd}
            className="flex-1 rounded-xl bg-safety-orange py-3 text-center text-sm font-bold text-white hover:bg-safety-orange/90 transition-colors"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}
