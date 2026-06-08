"use client";

import { useState, useEffect } from "react";

const CONSENT_KEY = "ship-tires-cookie-consent";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) {
      setVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(CONSENT_KEY, "granted");
    setVisible(false);
    // Update Google Consent Mode
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      window.gtag("consent", "update", {
        analytics_storage: "granted",
      });
    }
  };

  const handleDecline = () => {
    localStorage.setItem(CONSENT_KEY, "denied");
    setVisible(false);
    // Keep analytics denied
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      window.gtag("consent", "update", {
        analytics_storage: "denied",
      });
    }
  };

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9998,
        backgroundColor: "#0B1426",
        borderTop: "1px solid rgba(255, 165, 0, 0.2)",
        padding: "16px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "16px",
        flexWrap: "wrap",
      }}
    >
      <p style={{ color: "#d1d5db", fontSize: "14px", margin: 0, maxWidth: "600px" }}>
        We use cookies to analyze site traffic and improve your experience. By clicking
        &quot;Accept&quot;, you consent to our use of analytics cookies.
      </p>
      <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
        <button
          onClick={handleDecline}
          style={{
            padding: "8px 20px",
            borderRadius: "8px",
            border: "1px solid #6b7280",
            backgroundColor: "transparent",
            color: "#d1d5db",
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Decline
        </button>
        <button
          onClick={handleAccept}
          style={{
            padding: "8px 20px",
            borderRadius: "8px",
            border: "none",
            backgroundColor: "#f97316",
            color: "#ffffff",
            fontSize: "14px",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Accept
        </button>
      </div>
    </div>
  );
}
