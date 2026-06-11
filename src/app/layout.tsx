import type { Metadata } from "next";
import Script from "next/script";
import { Archivo_Black, Source_Sans_3, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getStats } from "@/lib/db";
import ChatBot from "@/components/ChatBot";
import CookieConsent from "@/components/CookieConsent";
import ClientProviders from "@/components/ClientProviders";

const archivoBlack = Archivo_Black({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-archivo-black",
  display: "swap",
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-source-sans",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Shop Tires Online — Ship Free Nationwide | Ship.Tires",
    template: "%s | Ship.Tires",
  },
  description:
    "Shop tires online from 34 brands including Michelin, Goodyear, Bridgestone, Continental, Pirelli, BFGoodrich, Cooper, Hankook, Yokohama & more. Ship free to your door or installer in Los Angeles, New York, Houston, Chicago, Phoenix & nationwide. Find tires for Honda, Toyota, Ford, Chevrolet, BMW & all vehicles. Call (279) 238-8473.",
  openGraph: {
    title: "Shop Tires Online — Ship Free Nationwide",
    description:
      "Shop 34 tire brands and ship free. Michelin, Goodyear, Bridgestone, Continental, Pirelli & more. Tires for Honda, Toyota, Ford, Chevy, BMW. Free shipping to any US address.",
    url: "https://ship.tires",
    siteName: "Ship.Tires",
    type: "website",
    images: [
      {
        url: "https://ship.tires/logo.png",
        width: 1200,
        height: 630,
        alt: "Ship.Tires — Shop Tires Online, Ship Free Nationwide",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Shop Tires Online — Ship Free Nationwide",
    description:
      "Shop 34 tire brands. Michelin, Goodyear, Bridgestone & more. Tires for Honda, Toyota, Ford. Free shipping nationwide.",
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
  other: {
    "theme-color": "#141414",
  },
  alternates: {},
  metadataBase: new URL("https://ship.tires"),
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": ["Organization", "Store"],
  name: "Ship.Tires",
  alternateName: "Ship Tires",
  url: "https://ship.tires",
  telephone: "+1-279-238-8473",
  email: "info@ship.tires",
  logo: "https://ship.tires/logo.png",
  description:
    "Shop tires online from 34 brands including Michelin, Goodyear, Bridgestone, Continental, Pirelli, BFGoodrich, Hankook, Yokohama, Cooper, Toyo, Falken, Firestone, Kumho, Nexen, Nitto, Dunlop, Nokian, General, Kelly, Maxxis, and more. Ship free to your door or installer anywhere in the US. Find tires for Honda, Toyota, Ford, Chevrolet, BMW, Mercedes-Benz, Nissan, Hyundai, Kia, Jeep, Ram, GMC, Subaru, Volkswagen, Audi, Lexus, Mazda, Tesla & all vehicles.",
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
  brand: [
    "Michelin", "Goodyear", "Bridgestone", "Continental", "Pirelli", "BFGoodrich",
    "Hankook", "Yokohama", "Cooper", "Toyo", "Falken", "Firestone", "Kumho",
    "Nexen", "Nitto", "Dunlop", "Nokian", "General", "Kelly", "Maxxis",
    "Sumitomo", "Uniroyal", "Mastercraft", "Federal", "Kenda", "Laufenn",
    "Ironman", "Radar", "Achilles", "Fuzion", "Sailun", "Westlake", "Hankook",
    "Milestar", "Gladiator", "Patriot", "Lexani", "Vercelli", "Atturo", "Mickey Thompson",
    "Dick Cepek", "Pro Comp", "Carlisle", "Titan", "Alliance", "Galaxy", "Harvest King",
    "Multi-Mile", "Dean", "Starfire",
  ].map((b) => ({ "@type": "Brand", name: b })),
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Tire Catalog — Shop & Ship Free",
    itemListElement: [
      { "@type": "OfferCatalog", name: "All-Season Tires" },
      { "@type": "OfferCatalog", name: "Winter Tires" },
      { "@type": "OfferCatalog", name: "Summer Tires" },
      { "@type": "OfferCatalog", name: "Performance Tires" },
      { "@type": "OfferCatalog", name: "All-Terrain Tires" },
      { "@type": "OfferCatalog", name: "Mud-Terrain Tires" },
      { "@type": "OfferCatalog", name: "Highway Tires" },
      { "@type": "OfferCatalog", name: "Touring Tires" },
      { "@type": "OfferCatalog", name: "Truck & SUV Tires" },
      { "@type": "OfferCatalog", name: "Honda Tires" },
      { "@type": "OfferCatalog", name: "Toyota Tires" },
      { "@type": "OfferCatalog", name: "Ford Tires" },
      { "@type": "OfferCatalog", name: "Chevrolet Tires" },
      { "@type": "OfferCatalog", name: "BMW Tires" },
      { "@type": "OfferCatalog", name: "Tesla Tires" },
      { "@type": "OfferCatalog", name: "Jeep Tires" },
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
  name: "Shop Tires Online — Ship Free Nationwide",
  provider: {
    "@type": "Organization",
    name: "Ship.Tires",
    url: "https://ship.tires",
  },
  description:
    "Shop tires online from 34 brands and ship free to your door or local installer. Find tires by vehicle (Honda, Toyota, Ford, Chevrolet, BMW, Nissan, Jeep, Tesla & more) or by tire size. Browse Michelin, Goodyear, Bridgestone, Continental, Pirelli, BFGoodrich, Cooper, Hankook, Yokohama and more. Free shipping to Los Angeles, New York, Chicago, Houston, Phoenix, Philadelphia, San Antonio, Dallas, San Diego, San Jose & everywhere in the continental US.",
  serviceType: [
    "Online Tire Sales",
    "Free Tire Shipping",
    "Ship Tires to Installer",
    "Vehicle Tire Lookup",
    "Tire Size Search",
    "Honda Tire Finder",
    "Toyota Tire Finder",
    "Ford Tire Finder",
    "Chevrolet Tire Finder",
    "BMW Tire Finder",
  ],
  areaServed: {
    "@type": "Country",
    name: "United States",
  },
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Shop Tires — Ship Free",
    itemListElement: [
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Free Tire Shipping",
          description:
            "Shop tires online and ship free to anywhere in the continental United States. Most orders arrive in 3-7 business days to Los Angeles, New York, Houston, Chicago, Phoenix & nationwide.",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Ship Tires to Your Installer",
          description:
            "Shop tires and ship directly to your preferred local tire installer for convenient same-day installation.",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Shop Tires by Vehicle",
          description:
            "Find the right tires for your Honda, Toyota, Ford, Chevrolet, Nissan, BMW, Mercedes-Benz, Hyundai, Kia, Jeep, Ram, Subaru, Volkswagen, Audi, Lexus, Mazda, or Tesla. Enter your year, make, and model.",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Shop Tires by Size",
          description:
            "Search our catalog of 307,000+ tires by size from 34 brands including Michelin, Goodyear, Bridgestone, Continental, and Pirelli.",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Free Tire Price Quotes",
          description:
            "Request a free tire quote by phone, email, or online. Call or text (279) 238-8473. We respond within hours.",
        },
      },
    ],
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const stats = await getStats();
  return (
    <html
      lang="en"
      className={`${archivoBlack.variable} ${sourceSans.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
        />
        <Script id="consent-defaults" strategy="beforeInteractive">
          {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('consent','default',{analytics_storage:'denied'});`}
        </Script>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-JQ5FYZVLXK"
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-JQ5FYZVLXK');var c=localStorage.getItem('ship-tires-cookie-consent');if(c==='granted'){gtag('consent','update',{analytics_storage:'granted'});}`}
        </Script>
      </head>
      <body className="min-h-full flex flex-col font-body">
        <ClientProviders>
          <Header brandCount={stats.brandCount} modelCount={stats.modelCount} tireCount={stats.tireCount} />
          <main className="flex-1">{children}</main>
          <Footer />
          <ChatBot />
          <CookieConsent />
        </ClientProviders>
      </body>
    </html>
  );
}
