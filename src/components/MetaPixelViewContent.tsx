"use client";

import { useEffect } from "react";

interface MetaPixelViewContentProps {
  contentId: string;
  contentName: string;
  contentType?: string;
  value?: number;
  currency?: string;
}

export default function MetaPixelViewContent({
  contentId,
  contentName,
  contentType = "product",
  value,
  currency = "USD",
}: MetaPixelViewContentProps) {
  useEffect(() => {
    if (typeof window !== "undefined" && typeof window.fbq === "function") {
      const params: Record<string, unknown> = {
        content_ids: [contentId],
        content_name: contentName,
        content_type: contentType,
      };
      if (value && value > 0) {
        params.value = value;
        params.currency = currency;
      }
      window.fbq("track", "ViewContent", params);
    }
  }, [contentId, contentName, contentType, value, currency]);

  return null;
}
