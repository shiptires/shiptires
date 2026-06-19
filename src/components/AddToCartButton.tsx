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
  variant?: "sm" | "lg";
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
  variant = "sm",
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

  const base = added
    ? "bg-green-600 hover:bg-green-700"
    : "bg-safety-orange hover:bg-safety-orange/90";

  const sizeClass =
    variant === "lg"
      ? "w-full justify-center rounded-xl px-6 py-4 text-lg"
      : "rounded-md px-3 py-1.5 text-xs";

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center gap-2 font-bold text-white transition-colors ${base} ${sizeClass}`}
    >
      {variant === "lg" && !added && (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
        </svg>
      )}
      {added ? "Added!" : "Add to Cart"}
    </button>
  );
}
