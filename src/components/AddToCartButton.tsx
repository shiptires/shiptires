"use client";

import { useState } from "react";
import { useCart } from "@/contexts/CartContext";

interface AddToCartButtonProps {
  brand: string;
  brandSlug: string;
  model: string;
  modelSlug: string;
  size: string;
  price: number;
  loadIndex: number;
  speedRating: string;
  defaultQty?: number;
  image?: string;
}

export default function AddToCartButton({
  brand,
  brandSlug,
  model,
  modelSlug,
  size,
  price,
  loadIndex,
  speedRating,
  defaultQty = 4,
  image,
}: AddToCartButtonProps) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  const handleClick = () => {
    addItem({
      brand,
      brandSlug,
      model,
      modelSlug,
      size,
      price,
      quantity: defaultQty,
      loadIndex,
      speedRating,
      image,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);

    fetch("/api/add-to-cart-alert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product: `${brand} ${model}`,
        size,
        brand,
        price,
        qty: defaultQty,
        page: window.location.href,
        time: new Date().toISOString(),
      }),
    }).catch(() => {});
  };

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center rounded-md px-3 py-1.5 text-xs font-bold text-white transition-colors ${
        added
          ? "bg-green-600 hover:bg-green-700"
          : "bg-orange hover:bg-orange-dark"
      }`}
    >
      {added ? "Added!" : "Add to Cart"}
    </button>
  );
}
