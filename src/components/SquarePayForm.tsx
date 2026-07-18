"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Script from "next/script";

interface SquarePayFormProps {
  appId: string;
  locationId: string;
  onPayment: (sourceId: string) => void;
  disabled?: boolean;
  loading?: boolean;
  total: number;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    Square?: {
      payments: (appId: string, locationId: string) => Promise<Payments>;
    };
  }
}

interface PaymentRequestConfig {
  countryCode: string;
  currencyCode: string;
  total: { amount: string; label: string };
}

interface PaymentRequest {
  addEventListener: (event: string, handler: (tokenResult: TokenResult) => void) => void;
}

interface TokenResult {
  status: string;
  token?: string;
  errors?: { message: string }[];
}

interface Payments {
  card: () => Promise<Card>;
  applePay: (paymentRequest: PaymentRequest) => Promise<WalletButton>;
  googlePay: (paymentRequest: PaymentRequest) => Promise<WalletButton>;
  paymentRequest: (config: PaymentRequestConfig) => PaymentRequest;
}

interface Card {
  attach: (selector: string) => Promise<void>;
  tokenize: () => Promise<TokenResult>;
  destroy: () => void;
}

interface WalletButton {
  attach: (selector: string) => Promise<void>;
  destroy: () => void;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export default function SquarePayForm({
  appId,
  locationId,
  onPayment,
  disabled = false,
  loading = false,
  total,
}: SquarePayFormProps) {
  const cardRef = useRef<Card | null>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [cardReady, setCardReady] = useState(false);
  const [tokenizing, setTokenizing] = useState(false);
  const [error, setError] = useState("");
  const initAttempted = useRef(false);
  const [applePayReady, setApplePayReady] = useState(false);
  const [googlePayReady, setGooglePayReady] = useState(false);
  const [initTimeout, setInitTimeout] = useState(false);
  const walletRefs = useRef<WalletButton[]>([]);

  const initCard = useCallback(async () => {
    if (initAttempted.current || !window.Square) return;
    initAttempted.current = true;

    try {
      const payments = await window.Square.payments(appId, locationId);
      const card = await payments.card();
      await card.attach("#square-card-container");
      cardRef.current = card;
      setCardReady(true);

      // Create payment request for Apple/Google Pay
      const paymentRequest = payments.paymentRequest({
        countryCode: "US",
        currencyCode: "USD",
        total: { amount: total.toFixed(2), label: "Ship.Tires" },
      });

      // Apple Pay — only shows if browser/device supports it
      try {
        const applePay = await payments.applePay(paymentRequest);
        await applePay.attach("#apple-pay-container");
        walletRefs.current.push(applePay);
        setApplePayReady(true);
      } catch {
        // Not supported on this device/browser — hide button
      }

      // Google Pay — only shows if browser/device supports it
      try {
        const googlePay = await payments.googlePay(paymentRequest);
        await googlePay.attach("#google-pay-container");
        walletRefs.current.push(googlePay);
        setGooglePayReady(true);
      } catch {
        // Not supported on this device/browser — hide button
      }

      // Apple/Google Pay auto-tokenize on click — listen for token events
      paymentRequest.addEventListener("token", (tokenResult: TokenResult) => {
        if (tokenResult.status === "OK" && tokenResult.token) {
          onPayment(tokenResult.token);
        }
      });
    } catch (err) {
      console.error("Square card init error:", err);
      setError("Failed to load payment form. Please refresh and try again.");
    }
  }, [appId, locationId, total, onPayment]);

  useEffect(() => {
    if (sdkReady) {
      initCard();
    }
  }, [sdkReady, initCard]);

  // Timeout: if card isn't ready after 10s, show retry
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!cardReady) setInitTimeout(true);
    }, 10000);
    return () => clearTimeout(timer);
  }, [cardReady]);

  useEffect(() => {
    return () => {
      if (cardRef.current) {
        try { cardRef.current.destroy(); } catch {}
      }
      for (const w of walletRefs.current) {
        try { w.destroy(); } catch {}
      }
    };
  }, []);

  const handleSubmit = async () => {
    if (!cardRef.current || disabled || loading || tokenizing) return;

    setTokenizing(true);
    setError("");

    try {
      const result = await cardRef.current.tokenize();
      if (result.status === "OK" && result.token) {
        onPayment(result.token);
      } else {
        const msg = result.errors?.[0]?.message || "Card validation failed. Please check your details.";
        setError(msg);
        setTokenizing(false);
      }
    } catch {
      setError("Payment failed. Please try again.");
      setTokenizing(false);
    }
  };

  const isProcessing = loading || tokenizing;

  return (
    <div>
      <Script
        src="https://web.squareup.com/v1/square.js"
        onLoad={() => setSdkReady(true)}
        strategy="afterInteractive"
      />

      {/* Express Checkout (only visible if supported) */}
      {(applePayReady || googlePayReady) && (
        <div className="mb-4">
          <p className="text-xs text-gray-500 text-center mb-2">Express Checkout</p>
          <div className="flex gap-2">
            <div id="apple-pay-container" className={applePayReady ? "flex-1" : "hidden"} />
            <div id="google-pay-container" className={googlePayReady ? "flex-1" : "hidden"} />
          </div>
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs text-gray-400">or pay with card</span>
            </div>
          </div>
        </div>
      )}

      {/* Hidden containers for Apple/Google Pay before they're ready */}
      {!applePayReady && <div id="apple-pay-container" className="hidden" />}
      {!googlePayReady && <div id="google-pay-container" className="hidden" />}

      <div
        id="square-card-container"
        className="min-h-[44px] rounded-lg border border-gray-300 p-1"
      />

      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}

      {initTimeout && !cardReady && !error && (
        <div className="mt-2 text-sm text-amber-700 bg-amber-50 p-3 rounded-lg">
          Payment form is loading slowly.
          <button
            onClick={() => {
              initAttempted.current = false;
              setInitTimeout(false);
              setError("");
              initCard();
            }}
            className="underline ml-1"
          >
            Try again
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={disabled || !cardReady || isProcessing}
        className="mt-4 w-full rounded-lg bg-safety-orange px-4 py-3 text-base font-bold text-white transition-colors hover:bg-orange-dark disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
              <path d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" fill="currentColor" className="opacity-75" />
            </svg>
            Processing...
          </span>
        ) : (
          `Pay $${total.toFixed(2)}`
        )}
      </button>
    </div>
  );
}
