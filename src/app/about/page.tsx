import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Ship.Tires — America's Tire Delivery Network",
  description:
    "Ship.Tires is a nationwide tire shipping company delivering 34 curated brands to your door or local installer. Free shipping on every order.",
  alternates: { canonical: "https://ship.tires/about" },
};

export default function AboutPage() {
  return (
    <div className="bg-gray-50">
      <div className="relative bg-navy py-14 text-white overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1600&q=80"
          alt="High performance vehicle"
          fill
          className="object-cover opacity-15"
          sizes="100vw"
        />
        <div className="absolute inset-0 racing-stripe" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-widest text-orange">Our Story</p>
          <h1 className="mt-2 text-3xl font-black sm:text-4xl tracking-tight">About Ship.Tires</h1>
          <p className="mt-3 text-lg text-gray-400">
            America&apos;s tire delivery network. From the track to the trail — tires shipped fast, installed near you.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="prose prose-lg max-w-none">
          <div className="rounded-xl bg-white border border-gray-200 p-8 shadow-sm space-y-6">
            <h2 className="text-2xl font-black text-gray-900">Our Mission</h2>
            <p className="text-gray-600 leading-relaxed">
              Ship.Tires was built on a simple idea: buying tires should be easy, affordable, and hassle-free.
              We connect customers with the tires they need from 34 curated brands and ship them free to anywhere
              in the continental United States — directly to your home or your local installer.
            </p>

            <h2 className="text-2xl font-black text-gray-900">Why We Exist</h2>
            <p className="text-gray-600 leading-relaxed">
              Most people dread buying tires. The process is confusing, prices vary wildly, and finding the
              right size feels like a guessing game. We built Ship.Tires to fix that. Our vehicle lookup tool
              finds your exact tire size in seconds, our catalog has hundreds of options across every major
              brand, and our team of tire experts is always a call or text away.
            </p>

            <h2 className="text-2xl font-black text-gray-900">What Makes Us Different</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {[
                { title: "Free Shipping, Always", desc: "Every order ships free. No minimum purchase, no hidden fees, no surprises." },
                { title: "Ship to Your Installer", desc: "We'll ship directly to your preferred tire shop so they're ready when you arrive." },
                { title: "Expert Guidance", desc: "Our tire experts help you find the perfect fit for your vehicle, driving style, and budget." },
                { title: "Huge Selection", desc: "34 brands, 800+ models, 307,000+ sizes. From economy to ultra-premium, we have it all." },
              ].map((item) => (
                <div key={item.title} className="rounded-lg bg-gray-50 p-5 border border-gray-100">
                  <h3 className="font-bold text-gray-900">{item.title}</h3>
                  <p className="mt-2 text-sm text-gray-600">{item.desc}</p>
                </div>
              ))}
            </div>

            <h2 className="text-2xl font-black text-gray-900">Our Brands</h2>
            <p className="text-gray-600 leading-relaxed">
              We carry 34 curated brands you trust: Advanta, BFGoodrich, Bridgestone, Continental, Cooper,
              Dunlop, Falken, Firestone, General Tire, Goodyear, Hankook, Hoosier, Kenda, Kumho, Laufenn,
              Maxxis, Michelin, Mickey Thompson, Nankang, Nexen, Nitto, Nokian, Pirelli, Power King, Radar,
              Range Finder, Riken, Sumitomo, Toyo, Uniroyal, Vitour, Vogue, Vredestein, and Yokohama.
              Whether you need premium touring tires for your sedan or rugged all-terrain tires for your truck, we have you covered.
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-xl bg-navy p-8 text-center text-white relative overflow-hidden">
          <div className="absolute inset-0 racing-stripe" />
          <div className="relative">
            <h2 className="text-2xl font-black">Ready to Find Your Tires?</h2>
            <p className="mt-2 text-gray-400">Browse our catalog or talk to a tire expert today.</p>
            <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link href="/tires" className="rounded-lg bg-orange px-6 py-3 text-sm font-bold text-white hover:bg-orange-light transition-colors">
                Browse Tires
              </Link>
              <a href="tel:+12792388473" className="rounded-lg border border-gray-600 px-6 py-3 text-sm font-bold text-white hover:bg-navy-light transition-colors">
                Call/Text (279) 238-8473 (TIRE)
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
