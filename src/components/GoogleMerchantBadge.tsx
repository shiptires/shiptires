"use client";

import Script from "next/script";

declare global {
  interface Window {
    merchantwidget?: {
      start: (config: Record<string, unknown>) => void;
    };
  }
}

export default function GoogleMerchantBadge() {
  return (
    <Script
      id="merchantWidgetScript"
      src="https://www.gstatic.com/shopping/merchant/merchantwidget.js"
      strategy="afterInteractive"
      onLoad={() => {
        window.merchantwidget?.start({
          merchant_id: 5806013968,
          position: "BOTTOM_LEFT",
          region: "en_US",
        });
      }}
    />
  );
}
