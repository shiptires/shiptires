"use client";

import { useEffect } from "react";

interface PurchaseItem {
  brand: string;
  model: string;
  size: string;
  qty: number;
  price: number;
  tireId?: string;
}

interface MetaPixelPurchaseProps {
  total: number;
  items: PurchaseItem[];
  currency?: string;
}

export default function MetaPixelPurchase({
  total,
  items,
  currency = "USD",
}: MetaPixelPurchaseProps) {
  useEffect(() => {
    if (typeof window !== "undefined" && typeof window.fbq === "function") {
      const contentIds = items.map(
        (item) => item.tireId || `${item.brand}-${item.model}-${item.size}`
      );
      window.fbq("track", "Purchase", {
        content_ids: contentIds,
        content_type: "product",
        value: total,
        currency,
        num_items: items.reduce((sum, item) => sum + item.qty, 0),
      });
    }
  }, [total, items, currency]);

  return null;
}
