"use client";

import { useEffect } from "react";
import Script from "next/script";

interface GoogleCustomerReviewsProps {
  orderId: string;
  email: string;
  estimatedDeliveryDate: string; // YYYY-MM-DD
}

declare global {
  interface Window {
    renderOptIn?: () => void;
    gapi?: {
      load: (api: string, callback: () => void) => void;
      surveyoptin: {
        render: (config: Record<string, unknown>) => void;
      };
    };
  }
}

export default function GoogleCustomerReviews({
  orderId,
  email,
  estimatedDeliveryDate,
}: GoogleCustomerReviewsProps) {
  useEffect(() => {
    window.renderOptIn = function () {
      window.gapi?.load("surveyoptin", function () {
        window.gapi?.surveyoptin.render({
          merchant_id: 5806013968,
          order_id: orderId,
          email: email,
          delivery_country: "US",
          estimated_delivery_date: estimatedDeliveryDate,
        });
      });
    };
  }, [orderId, email, estimatedDeliveryDate]);

  return (
    <Script
      src="https://apis.google.com/js/platform.js?onload=renderOptIn"
      strategy="afterInteractive"
    />
  );
}
