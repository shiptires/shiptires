"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/contexts/CartContext";
import type { CartItem } from "@/lib/types";

interface SharedCartClientProps {
  items: CartItem[];
  subtotal: number;
  totalItems: number;
}

export default function SharedCartClient({ items, totalItems }: SharedCartClientProps) {
  const { setItems } = useCart();
  const router = useRouter();

  useEffect(() => {
    setItems(items);
    // Redirect to the real cart page so the experience matches the site
    router.replace("/cart");
  }, [items, setItems, router]);

  return (
    <div className="bg-gray-50 min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-orange" />
        <p className="mt-4 text-sm text-gray-500">
          Loading your cart ({totalItems} tire{totalItems !== 1 ? "s" : ""})...
        </p>
      </div>
    </div>
  );
}
