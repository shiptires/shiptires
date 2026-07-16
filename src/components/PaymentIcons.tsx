import Image from "next/image";

const PAYMENT_METHODS = [
  { name: "Visa", src: "/payment-icons/visa.svg" },
  { name: "Mastercard", src: "/payment-icons/mastercard.svg" },
  { name: "Amex", src: "/payment-icons/amex.svg" },
  { name: "Discover", src: "/payment-icons/discover.svg" },
  { name: "PayPal", src: "/payment-icons/paypal.svg" },
  { name: "Apple Pay", src: "/payment-icons/apple-pay.svg" },
  { name: "Google Pay", src: "/payment-icons/google-pay.svg" },
  { name: "Venmo", src: "/payment-icons/venmo.svg" },
  { name: "Affirm", src: "/payment-icons/affirm.svg" },
  { name: "Afterpay", src: "/payment-icons/afterpay.svg" },
  { name: "Cash App", src: "/payment-icons/cashapp.svg" },
  { name: "Klarna", src: "/payment-icons/klarna.svg" },
] as const;

interface PaymentIconsProps {
  compact?: boolean;
}

export default function PaymentIcons({ compact = false }: PaymentIconsProps) {
  const w = compact ? 38 : 52;
  const h = compact ? 24 : 33;

  return (
    <div
      className={`flex flex-wrap items-center ${
        compact ? "gap-1.5 justify-center" : "gap-2 justify-center"
      }`}
    >
      {PAYMENT_METHODS.map((method) => (
        <Image
          key={method.name}
          src={method.src}
          alt={method.name}
          width={w}
          height={h}
          className="object-contain"
        />
      ))}
    </div>
  );
}
