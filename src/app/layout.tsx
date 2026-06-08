import type { Metadata } from "next";
import Script from "next/script";
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
    "Tires shipped free nationwide. Browse 21 top brands, 800+ sizes shipped free to 1,000 cities. Find tires near me — ship to your door or local installer. Call (916) 476-7689.",
  keywords: [
    "tires near me",
    "buy tires online",
    "tires shipped free",
    "free tire shipping",
    "ship tires",
    "tire shipping",
    "tires delivered",
    "tire delivery",
    "Michelin tires near me",
    "Goodyear tires near me",
    "Bridgestone tires near me",
    "Michelin tires",
    "Goodyear tires",
    "Bridgestone tires",
    "all-season tires",
    "winter tires",
    "performance tires",
    "tire sizes",
    "tire quotes",
    "nationwide tire delivery",
  ],
  openGraph: {
    title: "Ship.Tires — Tires Shipped Free. Near You.",
    description:
      "Free nationwide tire shipping. 21 brands, 80+ models, shipped free to 1,000 cities. Find tires near me.",
    url: "https://ship.tires",
    siteName: "Ship.Tires",
    type: "website",
    images: [
      {
        url: "https://ship.tires/logo.png",
        width: 1200,
        height: 630,
        alt: "Ship.Tires - Tires Shipped Free Nationwide",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ship.Tires — Tires Shipped Free. Near You.",
    description:
      "Free nationwide tire shipping. 21 brands, 80+ models, shipped free to 1,000 cities. Find tires near me.",
    images: ["https://ship.tires/logo.png"],
  },
  icons: {
    icon: "/icon",
    apple: "/logo.png",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://ship.tires",
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
  logo: "https://ship.tires/logo.png",
  description:
    "Tires shipped free nationwide. 21 brands, 800+ sizes shipped to 1,000 cities. Free shipping on every order — ship to your door or installer near you.",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Sacramento",
    addressRegion: "CA",
    addressCountry: "US",
  },
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
      { "@type": "OfferCatalog", name: "All-Terrain Tires" },
      { "@type": "OfferCatalog", name: "Touring Tires" },
      { "@type": "OfferCatalog", name: "Truck & SUV Tires" },
    ],
  },
  potentialAction: {
    "@type": "SearchAction",
    target: "https://ship.tires/search?q={search_term_string}",
    "query-input": "required name=search_term_string",
  },
};

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Nationwide Tire Shipping & Delivery",
  provider: {
    "@type": "Organization",
    name: "Ship.Tires",
    url: "https://ship.tires",
  },
  description:
    "Tires shipped free to your door or local installer near you. Browse 21 premium brands, search by vehicle or tire size, and get competitive quotes. Free shipping on every order.",
  serviceType: [
    "Tire Sales",
    "Tire Shipping",
    "Tire Delivery",
    "Vehicle Tire Lookup",
    "Tire Size Consultation",
  ],
  areaServed: {
    "@type": "Country",
    name: "United States",
  },
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Tire Services",
    itemListElement: [
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Free Tire Shipping",
          description: "Free shipping on all tire orders to anywhere in the continental United States. Most orders arrive within 3-7 business days.",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Ship to Installer",
          description: "Ship tires directly to your preferred local tire installer for convenient installation.",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Vehicle Tire Lookup",
          description: "Find compatible tire sizes by entering your vehicle year, make, and model.",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Tire Size Search",
          description: "Search our catalog by tire size to find all compatible tires from 20+ premium brands.",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Free Price Quotes",
          description: "Request a free tire quote by phone, email, or online form. We respond within hours.",
        },
      },
    ],
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
        />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-JQ5FYZVLXK"
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-JQ5FYZVLXK');`}
        </Script>
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
