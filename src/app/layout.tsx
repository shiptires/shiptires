import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ChatBot from "@/components/ChatBot";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: {
    default: "Ship.Tires — Tires Shipped Fast. Installed Near You.",
    template: "%s | Ship.Tires",
  },
  description:
    "Nationwide tire shipping with free delivery. Browse 20+ top brands, find the perfect fit for your vehicle, and get tires shipped to your door or local installer. Call (916) 476-7689.",
  keywords: [
    "buy tires online",
    "tire shipping",
    "tires delivered",
    "free tire shipping",
    "tire delivery",
    "Michelin tires",
    "Goodyear tires",
    "Bridgestone tires",
    "all-season tires",
    "winter tires",
    "performance tires",
    "tire sizes",
    "tire quotes",
    "nationwide tire delivery",
    "ship tires",
  ],
  openGraph: {
    title: "Ship.Tires — Tires Shipped Fast. Installed Near You.",
    description:
      "Free nationwide tire shipping. 20+ brands, 100+ models, delivered to your door or installer.",
    url: "https://ship.tires",
    siteName: "Ship.Tires",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
  metadataBase: new URL("https://ship.tires"),
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": ["Organization", "Store"],
  name: "Ship.Tires",
  url: "https://ship.tires",
  telephone: "+1-916-476-7689",
  email: "info@ship.tires",
  description:
    "Nationwide tire shipping with free delivery. Browse 20+ top brands and get tires shipped to your door or local installer.",
  areaServed: {
    "@type": "Country",
    name: "United States",
  },
  priceRange: "$$",
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Tire Catalog",
    itemListElement: [
      { "@type": "OfferCatalog", name: "All-Season Tires" },
      { "@type": "OfferCatalog", name: "Winter Tires" },
      { "@type": "OfferCatalog", name: "Performance Tires" },
      { "@type": "OfferCatalog", name: "All-Terrain Tires" },
    ],
  },
  potentialAction: {
    "@type": "SearchAction",
    target: "https://ship.tires/search?q={search_term_string}",
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <ChatBot />
      </body>
    </html>
  );
}
