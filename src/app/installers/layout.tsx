import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Find Tire Installers Near You — Free Shipping to Any Shop | Ship.Tires",
  description:
    "Find tire installation shops near you. Buy tires online at Ship.Tires and we ship them free to your chosen installer. Enter your zip code to find nearby tire shops.",
  alternates: { canonical: "https://ship.tires/installers" },
  openGraph: {
    title: "Find Tire Installers Near You — Ship.Tires",
    description:
      "Buy tires online and ship free to any installer. Find tire shops near you by zip code.",
    url: "https://ship.tires/installers",
    type: "website",
    siteName: "Ship.Tires",
  },
};

export default function InstallersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
