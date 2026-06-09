import type { Metadata } from "next";
import Script from "next/script";
import { Archivo_Black, Source_Sans_3, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
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
    default: "Tires Shipped Free. Near You. | Ship.Tires",
    template: "%s | Ship.Tires",
  },
  description:
    "Tires shipped free nationwide. 21 brands, 100+ models, 800+ sizes shipped to your door or installer. Call or text (279) 238-8473 to order.",
  openGraph: {
    title: "Tires Shipped Free. Near You.",
    description:
      "Free nationwide tire shipping. 21 brands, 100+ models, 800+ sizes shipped to your door or installer.",
    url: "https://ship.tires",
    siteName: "Ship.Tires",
    type: "website",
    images: [
      {
        url: "https://ship.tires/logo.png",
        width: 1200,
        height: 630,
        alt: "Ship.Tires — Tires Shipped Free Nationwide",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tires Shipped Free. Near You.",
    description:
      "Free nationwide tire shipping. 21 brands, 100+ models, 800+ sizes shipped to your door or installer.",
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
  alternates: {},
  metadataBase: new URL("https://ship.tires"),
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": ["Organization", "Store"],
  name: "Ship.Tires",
  url: "https://ship.tires",
  telephone: "+1-279-238-8473",
  email: "info@ship.tires",
  logo: "https://ship.tires/logo.png",
  description:
    "Tires shipped free nationwide. 21 brands, 100+ models, 800+ sizes shipped to your door or installer.",
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
      { "@type": "OfferCatalog", name: "Mud-Terrain Tires" },
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
    "Tires shipped free to your door or local installer. Browse 21 brands, search by vehicle or tire size, and get competitive quotes. Free shipping on every order.",
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
          description:
            "Free shipping on all tire orders to anywhere in the continental United States. Most orders arrive within 3-7 business days.",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Ship to Installer",
          description:
            "Ship tires directly to your preferred local tire installer for convenient installation.",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Vehicle Tire Lookup",
          description:
            "Find compatible tire sizes by entering your vehicle year, make, and model.",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Tire Size Search",
          description:
            "Search our catalog by tire size to find all compatible tires from 21 brands.",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Free Price Quotes",
          description:
            "Request a free tire quote by phone, email, or online form. We respond within hours.",
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
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <ChatBot />
          <CookieConsent />
        </ClientProviders>
      </body>
    </html>
  );
}
